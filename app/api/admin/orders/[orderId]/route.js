import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAdminSupabase() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };

  return { supabase, user };
}

export async function PATCH(req, { params }) {
  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;
  const { orderId } = await params;
  const body = await req.json();
  const { action } = body; // "confirm" | "cancel"

  // Lấy order hiện tại
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items ( figure_id, quantity )")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return Response.json({ error: "Đơn hàng không tồn tại" }, { status: 404 });
  }

  // ✅ XÁC NHẬN ĐƠN
  if (action === "confirm") {
    if (order.status !== "pending") {
      return Response.json({ error: "Chỉ có thể xác nhận đơn đang chờ" }, { status: 400 });
    }

    // COD: trừ stock khi admin confirm
    if (order.payment_status === "unpaid") {
      for (const item of order.order_items) {
        const { data: fig } = await supabase
          .from("figures")
          .select("stock_quantity, order_type")
          .eq("id", item.figure_id)
          .single();

        if (fig?.order_type === "available" && fig.stock_quantity < item.quantity) {
          return Response.json(
            { error: `Sản phẩm ${item.figure_id} không đủ tồn kho` },
            { status: 400 }
          );
        }

        if (fig?.order_type === "available") {
          await supabase
            .from("figures")
            .update({ stock_quantity: fig.stock_quantity - item.quantity })
            .eq("id", item.figure_id);
        }
      }
    }

    await supabase
      .from("orders")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    return Response.json({ success: true, message: "Đã xác nhận đơn hàng" });
  }

  // ❌ HUỶ ĐƠN
  if (action === "cancel") {
    if (order.status === "cancelled") {
      return Response.json({ error: "Đơn đã bị huỷ rồi" }, { status: 400 });
    }

    // Nếu đơn đã confirm (stock đã trừ) → hoàn lại stock
    if (order.status === "confirmed") {
      for (const item of order.order_items) {
        const { data: fig } = await supabase
          .from("figures")
          .select("stock_quantity, order_type")
          .eq("id", item.figure_id)
          .single();

        if (fig?.order_type === "available") {
          await supabase
            .from("figures")
            .update({ stock_quantity: fig.stock_quantity + item.quantity })
            .eq("id", item.figure_id);
        }
      }
    }

    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: order.payment_status === "paid" ? "refunded" : order.payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return Response.json({ success: true, message: "Đã huỷ đơn hàng" });
  }

  return Response.json({ error: "Action không hợp lệ" }, { status: 400 });
}
