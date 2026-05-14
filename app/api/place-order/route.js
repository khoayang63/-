import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const body = await req.json();
        const { sessionId, form, paymentMethod, selectedVoucherCodes = [], shippingData } = body;

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

        // 🔐 1. Auth
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 👑 Khởi tạo Admin Client để bypass RLS khi ghi dữ liệu
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 📦 2. Lấy session
        const { data: session, error: sessionError } = await supabase
            .from("checkout_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (sessionError || !session) {
            return Response.json({ error: "Session not found" }, { status: 404 });
        }

        // ⏰ 3. Check expire
        if (new Date(session.expires_at) < new Date()) {
            return Response.json({ error: "Session expired" }, { status: 400 });
        }

        const items = session.items;

        // 🧠 4. Map quantity
        const qtyMap = new Map(items.map((i) => [i.id, i.quantity]));
        const ids = items.map((i) => i.id);

        // 📦 5. Fetch lại DB (KHÔNG tin client)
        const { data: figures, error: figError } = await supabase
            .from("figures")
            .select("id, price, stock_quantity, order_type")
            .in("id", ids);

        if (figError || !figures) {
            return Response.json({ error: "Fetch failed" }, { status: 500 });
        }

        // 💰 6. Validate + tính tiền
        let totalAmount = 0;

        for (const fig of figures) {
            const qty = qtyMap.get(fig.id);

            if (!qty || qty <= 0) {
                return Response.json({ error: "Invalid quantity" }, { status: 400 });
            }

            if (fig.order_type === "available" && fig.stock_quantity < qty) {
                return Response.json({ error: "Out of stock" }, { status: 400 });
            }

            totalAmount += fig.price * qty;
        }

        // 🚚 6.1 Tính toán lại phí ship (Chống gian lận)
        let serverShippingFee = 50000;
        const SHOP_LAT = 10.772596;
        const SHOP_LNG = 106.671337;

        if (shippingData && shippingData.lat && shippingData.lng) {
            try {
                const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${SHOP_LNG},${SHOP_LAT};${shippingData.lng},${shippingData.lat}?overview=false`);
                const osrmData = await osrmRes.json();
                if (osrmData.routes && osrmData.routes.length > 0) {
                    const distanceKm = osrmData.routes[0].distance / 1000;
                    if (distanceKm <= 5) serverShippingFee = 15000;
                    else if (distanceKm <= 10) serverShippingFee = 30000;
                }
            } catch (e) {
                console.error("OSRM Backend Error:", e);
            }
        }

        // 🎟️ 6.5. Validate và áp dụng Vouchers
        let discountAmount = 0;
        let validVouchers = [];

        if (selectedVoucherCodes && selectedVoucherCodes.length > 0) {
            const { data: dbVouchers, error: voucherErr } = await supabase
                .from("vouchers")
                .select("*")
                .in("code", selectedVoucherCodes)
                .eq("is_active", true);

            if (voucherErr) {
                return Response.json({ error: "Lỗi kiểm tra mã giảm giá" }, { status: 500 });
            }

            for (const v of dbVouchers) {
                if (v.usage_limit !== null && v.used_count >= v.usage_limit) {
                    return Response.json({ error: `Mã ${v.code} đã hết lượt sử dụng` }, { status: 400 });
                }
                if (v.expires_at && new Date(v.expires_at) < new Date()) {
                    return Response.json({ error: `Mã ${v.code} đã hết hạn` }, { status: 400 });
                }
                if (v.min_order !== null && totalAmount < v.min_order) {
                    return Response.json({ error: `Mã ${v.code} yêu cầu đơn tối thiểu ${v.min_order}` }, { status: 400 });
                }
                validVouchers.push(v);
            }

            const fixedDiscounts = validVouchers
                .filter(v => v.discount_type === "fixed")
                .reduce((sum, v) => sum + Number(v.discount_value), 0);
                
            const percentDiscounts = validVouchers
                .filter(v => v.discount_type === "percent")
                .reduce((sum, v) => sum + (totalAmount * (Number(v.discount_value) / 100)), 0);

            const shippingDiscounts = validVouchers
                .filter(v => v.discount_type === "shipping")
                .reduce((sum, v) => sum + Number(v.discount_value), 0);
                
            const shippingDiscountAmount = Math.min(shippingDiscounts, serverShippingFee);

            discountAmount = fixedDiscounts + percentDiscounts + shippingDiscountAmount;
            
            const productDiscount = fixedDiscounts + percentDiscounts;
            if (productDiscount > totalAmount) {
                discountAmount = totalAmount + shippingDiscountAmount;
            }
        }

        const finalAmount = Math.max(0, totalAmount + serverShippingFee - discountAmount);

        // 💳 7. Xác định trạng thái theo Plan
        const method = paymentMethod === "ONLINE" ? "SEPAY" : "COD";
        const payment_status = paymentMethod === "ONLINE" ? "processing" : "unpaid";

        // 🧾 8. CREATE ORDER
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_id: user.id,
                total_amount: finalAmount, // Đã áp dụng giảm giá
                status: "pending",
                payment_status,
                shipping_address: form.address,
                phone_number: form.phone,
                note: form.note,
            })
            .select()
            .single();

        if (orderError) {
            console.error("ORDER ERROR:", orderError);
            return Response.json({ error: "Create order failed" }, { status: 500 });
        }

        // 📋 9. ORDER ITEMS
        const orderItems = figures.map((fig) => ({
            order_id: order.id,
            figure_id: fig.id,
            price_at_purchase: fig.price,
            quantity: qtyMap.get(fig.id),
        }));

        const { error: itemError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemError) {
            return Response.json({ error: "Create order items failed" }, { status: 500 });
        }

        // 💳 10. CREATE PAYMENT (Step 2)
        const methodId = paymentMethod === "ONLINE" ? 2 : 1; // 1: COD, 2: SEPAY

        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .insert({
                order_id: order.id,
                payment_method_id: methodId,
                amount: finalAmount,
                status: "pending",
            })
            .select()
            .single();

        if (paymentError) {
            console.error("PAYMENT ERROR:", paymentError);
            return Response.json({ error: "Create payment failed" }, { status: 500 });
        }

        // 🎟️ 10.1 Xử lý Voucher sau khi tạo order thành công
        if (validVouchers.length > 0) {
            // Lưu vào bảng order_vouchers
            const orderVouchersData = validVouchers.map(v => ({
                order_id: order.id,
                voucher_id: v.id
            }));
            
            const { error: ovError } = await adminSupabase
                .from("order_vouchers")
                .insert(orderVouchersData);
                
            if (ovError) {
                console.error("ORDER VOUCHERS ERROR:", ovError);
                // Vẫn tiếp tục dù lỗi lưu lịch sử
            }

            // Cập nhật used_count của từng voucher
            for (const v of validVouchers) {
                await adminSupabase
                    .from("vouchers")
                    .update({ used_count: v.used_count + 1 })
                    .eq("id", v.id);
            }
        }

        // 🧹 10. Xoá session
        await supabase
            .from("checkout_sessions")
            .delete()
            .eq("id", sessionId);

        // 🛒 11. Xoá sản phẩm khỏi giỏ hàng (Database)
        const { data: cart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (cart) {
            await supabase
                .from("cart_items")
                .delete()
                .eq("cart_id", cart.id)
                .in("figure_id", ids);
        }

        // 🎯 DONE
        return Response.json({
            orderId: order.id,
            paymentId: payment.id,
        });

    } catch (err) {
        console.error("💥 ERROR:", err);
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}