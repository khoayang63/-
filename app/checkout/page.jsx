"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CheckoutPage() {
    const { cart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const createSession = async () => {
            if (!cart || cart.length === 0) {
                toast.error("Giỏ hàng trống");
                router.push("/cart");
                return;
            }

            setLoading(true);

            try {
                // 👉 chỉ gửi id + quantity
                const items = cart.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                }));

                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ items }),
                });

                const data = await res.json();

                if (!res.ok) {
                    toast.error(data.error || "Checkout failed");
                    return;
                }

                // 👉 redirect sang checkout session
                router.replace(`/checkout/${data.sessionId}`);
            } catch (err) {
                console.error(err);
                toast.error("Lỗi tạo session");
            } finally {
                setLoading(false);
            }
        };

        createSession();
    }, [cart]);

    return (
        <div className="p-6 text-center">
            {loading ? "Đang chuyển sang thanh toán..." : "Đang xử lý..."}
        </div>
    );
}