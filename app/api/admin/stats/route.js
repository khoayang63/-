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

export async function GET() {
  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;

  // Tổng đơn hàng theo status
  const { data: orders } = await supabase.from("orders").select("id, status, total_amount, payment_status");

  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
  const confirmedOrders = orders?.filter((o) => o.status === "confirmed").length || 0;
  const cancelledOrders = orders?.filter((o) => o.status === "cancelled").length || 0;

  const totalRevenue = orders
    ?.filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total_amount, 0) || 0;

  const paidOrders = orders?.filter((o) => o.payment_status === "paid").length || 0;

  // Tổng sản phẩm
  const { count: totalProducts } = await supabase
    .from("figures")
    .select("id", { count: "exact", head: true });

  // Sản phẩm hết hàng
  const { count: outOfStock } = await supabase
    .from("figures")
    .select("id", { count: "exact", head: true })
    .eq("order_type", "available")
    .lte("stock_quantity", 0);

  return Response.json({
    totalOrders,
    pendingOrders,
    confirmedOrders,
    cancelledOrders,
    totalRevenue,
    paidOrders,
    totalProducts: totalProducts || 0,
    outOfStock: outOfStock || 0,
  });
}
