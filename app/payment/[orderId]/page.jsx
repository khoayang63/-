"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

export default function PaymentPage() {
    const { orderId } = useParams();
    const router = useRouter();
    const { removeItems } = useCart();
    const [orderInfo, setOrderInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderInfo = async () => {
        try {
            const res = await fetch("/api/payment/sepay/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.paymentStatus === "paid") {
                    toast.success("Thanh toán thành công!");
                    if (removeItems && data.itemIds?.length > 0) {
                        removeItems(data.itemIds);
                    }
                    router.replace(`/order/${orderId}`);
                    return true; // Stop polling
                }
                setOrderInfo(data);
            } else {
                toast.error(data.error || "Không thể lấy thông tin đơn hàng");
                router.replace(`/order/${orderId}`);
                return true;
            }
        } catch (err) {
            console.error(err);
        }
        return false;
    };

    useEffect(() => {
        if (!orderId) return;

        let interval;

        const init = async () => {
            const shouldStop = await fetchOrderInfo();
            setLoading(false);

            if (!shouldStop) {
                interval = setInterval(async () => {
                    const stop = await fetchOrderInfo();
                    if (stop) clearInterval(interval);
                }, 5000); // Poll every 5 seconds
            }
        };

        init();

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [orderId, router]);

    // 🧪 AUTO-SIMULATE PAYMENT (For testing without real money)
    useEffect(() => {
        if (!orderInfo || orderInfo.paymentStatus === "paid") return;

        const timer = setTimeout(async () => {
            console.log("🧪 Auto-simulating payment webhook...");
            try {
                await fetch("/api/payment/sepay/webhook", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transaction: {
                            transaction_status: "APPROVED",
                            transaction_amount: orderInfo.amount,
                        },
                        order: {
                            order_id: orderInfo.orderId,
                        }
                    })
                });
            } catch (err) {
                console.error("Simulation failed", err);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [orderInfo]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <h2 className="text-xl font-medium text-gray-700">Đang tải thông tin thanh toán...</h2>
            </div>
        );
    }

    if (!orderInfo) return null;

    const qrUrl = `https://qr.sepay.vn/img?acc=${orderInfo.accountNumber}&bank=${orderInfo.bankName}&amount=${orderInfo.amount}&des=${orderInfo.orderId}`;

    return (
        <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-md border border-gray-100">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Thanh Toán Đơn Hàng #{orderInfo.orderId}</h1>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="flex-shrink-0 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrUrl} alt="QR Code Thanh Toán" className="w-64 h-64 object-contain" />
                </div>

                <div className="space-y-4 flex-1">
                    <p className="text-gray-600">
                        Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán tự động.
                    </p>
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg">
                        <ul className="space-y-2 font-medium">
                            <li><span className="text-gray-500">Ngân hàng:</span> {orderInfo.bankName}</li>
                            <li><span className="text-gray-500">Số TK:</span> {orderInfo.accountNumber}</li>
                            <li><span className="text-gray-500">Số tiền:</span> {orderInfo.amount.toLocaleString()} VNĐ</li>
                            <li><span className="text-gray-500">Nội dung:</span> <span className="font-bold text-black">{orderInfo.orderId}</span></li>
                        </ul>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        Hệ thống đang chờ thanh toán của bạn...
                    </div>
                </div>
            </div>
        </div>
    );
}
