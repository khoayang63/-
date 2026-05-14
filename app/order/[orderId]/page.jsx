"use client";
import { useParams, useRouter } from "next/navigation";

export default function OrderPage() {
    const { orderId } = useParams();
    const router = useRouter();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center border border-slate-800 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <span className="text-4xl">🎉</span>
                </div>

                <h1 className="text-3xl font-extrabold mb-4 text-white tracking-tight">
                    Đặt hàng <span className="text-emerald-400">thành công!</span>
                </h1>

                <p className="mb-2 text-slate-400 font-medium">Mã đơn hàng của bạn:</p>

                <p className="font-mono text-lg mb-6 bg-slate-950 py-3 px-4 rounded-xl border border-slate-800 text-amber-500 break-all shadow-inner">
                    {orderId}
                </p>

                <p className="text-slate-300 mb-8 leading-relaxed">
                    Cảm ơn bạn đã mua sắm! Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất 🚚
                </p>

                <button
                    onClick={() => router.push("/")}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] text-lg"
                >
                    Tiếp tục mua sắm
                </button>
            </div>
        </div>
    );
}