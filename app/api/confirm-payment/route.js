import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const body = await req.json();
        const { orderId } = body;

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

        // 🔐 Auth
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 📦 Lấy order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, user_id, payment_status, order_items ( figure_id, quantity )")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return Response.json({ error: "Order not found" }, { status: 404 });
        }

        // 🔒 Chỉ chủ order mới được confirm
        if (order.user_id !== user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        // ✅ Check đã thanh toán chưa
        if (order.payment_status === "paid") {
            return Response.json({ message: "Already paid" });
        }

        // 💳 Update payment_status → paid
        const { error: updateError } = await supabase
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("id", orderId);

        if (updateError) {
            return Response.json({ error: "Update failed" }, { status: 500 });
        }

        // 📦 Trừ stock ngay khi thanh toán online thành công
        for (const item of order.order_items || []) {
            const { data: fig } = await supabase
                .from("figures")
                .select("stock_quantity, order_type")
                .eq("id", item.figure_id)
                .single();

            if (fig?.order_type === "available" && fig.stock_quantity >= item.quantity) {
                await supabase
                    .from("figures")
                    .update({ stock_quantity: fig.stock_quantity - item.quantity })
                    .eq("id", item.figure_id);
            }
        }

        // 🔄 Update payment record
        await supabase
            .from("payments")
            .update({ status: "completed" })
            .eq("order_id", orderId);

        return Response.json({ success: true });

    } catch (err) {
        console.error("💥 CONFIRM PAYMENT ERROR:", err);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
