
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
    try {
        const body = await req.json();
        console.log("=== SEPAY WEBHOOK ===", body);

        // 1. Validate payload
        if (!body?.transaction || !body?.order) {
            return Response.json({ error: "Invalid payload" }, { status: 400 });
        }

        const transaction = body.transaction;
        const orderData = body.order;

        // 2. Only APPROVED
        if (transaction.transaction_status !== "APPROVED") {
            return Response.json({ message: "Ignored" });
        }

        const orderId = orderData.order_id;

        if (!orderId) {
            return Response.json({ error: "Missing orderId" }, { status: 400 });
        }

        // 3. Init Supabase
        // const cookieStore = await cookies();
        // const supabase = createServerClient(
        //     process.env.NEXT_PUBLIC_SUPABASE_URL,
        //     process.env.SUPABASE_SERVICE_ROLE_KEY,
        //     {
        //         cookies: {
        //             getAll: () => cookieStore.getAll(),
        //         },
        //     }
        // );
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        // 4. Fetch order + items
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (
                    figure_id,
                    quantity
                )
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.log("Order not found:", orderId);
            return Response.json({ error: "Order not found" }, { status: 404 });
        }

        // 5. Check amount
        const paidAmount = Number(transaction.transaction_amount || 0);

        if (paidAmount < order.total_amount) {
            return Response.json({
                success: false,
                message: "Insufficient amount",
            });
        }

        // 6. Idempotent (chống gọi lại)
        if (order.payment_status === "paid") {
            return Response.json({ message: "Already processed" });
        }

        // 7. Update ORDER
        const { error: updateOrderError } = await supabase
            .from("orders")
            .update({
                payment_status: "paid",
                status: "confirmed",
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (updateOrderError) {
            console.error("Order update error:", updateOrderError);
            return Response.json({ error: "Update order failed" }, { status: 500 });
        }

        // 8. Update PAYMENT
        const { error: paymentError } = await supabase
            .from("payments")
            .update({
                status: "completed",
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderId);

        if (paymentError) {
            console.error("Payment update error:", paymentError);
            return Response.json({ error: "Payment update failed" }, { status: 500 });
        }

        // 9. 🔥 TRỪ STOCK (QUAN TRỌNG)
        for (const item of order.order_items) {
            const { error: stockError } = await supabase.rpc("decrease_stock", {
                p_figure_id: item.figure_id,
                p_quantity: item.quantity,
            });

            if (stockError) {
                console.error("Stock error:", stockError);
                return Response.json({ error: "Stock update failed" }, { status: 500 });
            }
        }

        console.log(`✅ Order ${orderId} COMPLETED`);

        return Response.json({ success: true });

    } catch (err) {
        console.error("Sepay Webhook Error:", err);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}