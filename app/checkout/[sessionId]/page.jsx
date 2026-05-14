"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import CheckoutForm from "../components/CheckoutForm";
import CheckoutList from "../components/CheckoutList";
import OrderSummary from "../components/OrderSummary";

export default function CheckoutPage() {
    const { sessionId } = useParams();
    const router = useRouter();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [selectedVouchers, setSelectedVouchers] = useState([]);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        province: null,
        district: null,
        ward: null,
        street: "",
        note: "",
    });

    const [shippingData, setShippingData] = useState({
        fee: 0,
        distanceKm: 0,
        lat: null,
        lng: null
    });

    // 🔥 Fetch session
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch(`/api/checkout/${sessionId}`);
                const data = await res.json();

                if (!res.ok) {
                    if (data.error === "Session expired") {
                        router.replace("/cart");
                        return;
                    }

                    toast.error(data.error || "Session không tồn tại");
                    router.replace("/cart");
                    return;
                }

                setItems(data.items);
            } catch (err) {
                console.error(err);
                toast.error("Lỗi load session");
                router.replace("/cart");
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) fetchSession();
    }, [sessionId]);

    // 💰 Tổng
    const totalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const totalQty = items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    // 🧾 Đặt hàng
    const handlePlaceOrder = async () => {
        if (!form.name || !form.phone || !form.province || !form.district || !form.ward || !form.street) {
            toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
            return;
        }

        if (!shippingData.lat || !shippingData.lng) {
            toast.error("Đang chờ tính toán phí ship, vui lòng đợi...");
            return;
        }

        // Tạo full address string để lưu DB
        const fullAddress = `${form.street}, ${form.ward.name}, ${form.district.name}, ${form.province.name}`;

        try {
            const res = await fetch("/api/place-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId,
                    form: { ...form, address: fullAddress },
                    paymentMethod,
                    selectedVoucherCodes: selectedVouchers.map(v => v.code),
                    shippingData,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "Session expired") {
                    toast.error("Phiên đã hết hạn, vui lòng checkout lại");
                    router.replace("/cart");
                    return;
                }

                toast.error(data.error || "Đặt hàng thất bại");
                return;
            }

            if (paymentMethod === "ONLINE") {
                toast.success("Đang chuyển sang thanh toán...");
                router.push(`/payment/${data.orderId}`);
            } else {
                toast.success("Đặt hàng thành công 🎉");
                router.push(`/order/${data.orderId}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi đặt hàng");
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex justify-center items-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            <div className="mb-8 pb-4 border-b border-slate-800">
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                    <span className="text-amber-500">💳</span> Thanh toán
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                    <CheckoutForm form={form} setForm={setForm} setShippingData={setShippingData} />
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <CheckoutList cart={items} />

                    <OrderSummary
                        totalPrice={totalPrice}
                        totalQty={totalQty}
                        shippingFee={shippingData.fee}
                        distanceKm={shippingData.distanceKm}
                        onCheckout={handlePlaceOrder}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        selectedVouchers={selectedVouchers}
                        setSelectedVouchers={setSelectedVouchers}
                    />
                </div>
            </div>
        </div>
    );
}