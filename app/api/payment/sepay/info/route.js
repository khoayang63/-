import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const { orderId } = await req.json();
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                },
            }
        );

        // Verify authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch order
        const { data: order, error } = await supabase
            .from("orders")
            .select("id, total_amount, payment_status, order_items(figure_id)")
            .eq("id", orderId)
            .eq("user_id", user.id) // Ensure the order belongs to the user
            .single();

        if (error || !order) {
            return Response.json({ error: "Order not found" }, { status: 404 });
        }

        return Response.json({
            orderId: order.id,
            amount: order.total_amount,
            paymentStatus: order.payment_status,
            bankName: process.env.SEPAY_BANK_NAME,
            accountNumber: process.env.SEPAY_ACCOUNT_NUMBER,
            itemIds: order.order_items.map(item => item.figure_id)
        });
    } catch (err) {
        console.error("Fetch order info error:", err);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}
