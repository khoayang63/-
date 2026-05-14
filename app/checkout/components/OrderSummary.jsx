import VoucherSelection from "./VoucherSelection";

export default function OrderSummary({ totalPrice, totalQty, shippingFee = 0, distanceKm = 0, onCheckout, paymentMethod, setPaymentMethod, selectedVouchers, setSelectedVouchers }) {
    // 1. Tính tổng giảm giá từ vouchers
    let discountAmount = 0;
    
    if (selectedVouchers && selectedVouchers.length > 0) {
        // Cộng tất cả các mã 'fixed'
        const fixedDiscounts = selectedVouchers
            .filter(v => v.discount_type === "fixed")
            .reduce((sum, v) => sum + Number(v.discount_value), 0);
            
        // Tính % dựa trên tổng tiền ban đầu
        const percentDiscounts = selectedVouchers
            .filter(v => v.discount_type === "percent")
            .reduce((sum, v) => sum + (totalPrice * (Number(v.discount_value) / 100)), 0);
            
        // Tính giảm giá shipping (Tối đa bằng tiền ship)
        const shippingDiscounts = selectedVouchers
            .filter(v => v.discount_type === "shipping")
            .reduce((sum, v) => sum + Number(v.discount_value), 0);
            
        const shippingDiscountAmount = Math.min(shippingDiscounts, shippingFee);
        
        discountAmount = fixedDiscounts + percentDiscounts + shippingDiscountAmount;
        
        // Đảm bảo giảm giá (chỉ tính cho hàng hoá) không vượt quá tổng tiền hàng
        const productDiscount = fixedDiscounts + percentDiscounts;
        if (productDiscount > totalPrice) {
            discountAmount = totalPrice + shippingDiscountAmount;
        }
    }

    const finalAmount = Math.max(0, totalPrice + shippingFee - discountAmount);

    return (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="text-amber-500">🧾</span> Đơn hàng ({totalQty} sản phẩm)
            </h2>

            {/* Tạm tính */}
            <div className="flex justify-between mb-3 text-slate-400">
                <span>Tạm tính</span>
                <span className="text-white font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                    }).format(totalPrice)}
                </span>
            </div>

            {/* Ship */}
            <div className="flex justify-between mb-4 text-slate-400 items-start">
                <div>
                    <span className="block">Phí vận chuyển</span>
                    {distanceKm > 0 && distanceKm !== 999 && (
                        <span className="text-xs text-slate-500">Khoảng cách: {distanceKm.toFixed(1)} km</span>
                    )}
                    {distanceKm === 999 && (
                        <span className="text-xs text-amber-500/70">Mặc định (ngoài vùng)</span>
                    )}
                </div>
                <span className="text-amber-500 font-medium">
                    {shippingFee === 0 
                        ? "0 ₫" 
                        : new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(shippingFee)}
                </span>
            </div>

            {/* Giảm giá */}
            {discountAmount > 0 && (
                <div className="flex justify-between mb-4 text-emerald-400">
                    <span>Khuyến mãi (Voucher)</span>
                    <span className="font-bold">
                        -{new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(discountAmount)}
                    </span>
                </div>
            )}

            <div className="h-px w-full bg-slate-800 my-4" />

            {/* TOTAL */}
            <div className="flex justify-between mb-6 items-center">
                <span className="font-bold text-white text-lg">Tổng cộng</span>
                <div className="text-right">
                    {(discountAmount > 0 || shippingFee > 0) && (
                        <div className="text-sm text-slate-500 line-through mb-1">
                            {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            }).format(totalPrice + shippingFee)}
                        </div>
                    )}
                    <span className="font-extrabold text-amber-500 text-2xl">
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(finalAmount)}
                    </span>
                </div>
            </div>

            <div className="h-px w-full bg-slate-800 my-6" />

            <VoucherSelection 
                totalPrice={totalPrice} 
                selectedVouchers={selectedVouchers || []} 
                setSelectedVouchers={setSelectedVouchers} 
            />

            {/* 💳 PHƯƠNG THỨC THANH TOÁN */}
            <div className="space-y-4 mb-8">
                <h3 className="font-bold text-white text-lg mb-4">Phương thức thanh toán</h3>

                <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                    paymentMethod === "COD" 
                        ? "bg-amber-500/10 border-amber-500" 
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}>
                    <div className="mt-1">
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="COD"
                            checked={paymentMethod === "COD"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 accent-amber-500"
                        />
                    </div>
                    <div>
                        <span className={`font-bold block mb-1 ${paymentMethod === "COD" ? "text-amber-500" : "text-white"}`}>
                            🚚 Thanh toán khi nhận hàng (COD)
                        </span>
                        <p className="text-sm text-slate-400 leading-relaxed">Thanh toán bằng tiền mặt khi nhân viên giao hàng đến.</p>
                    </div>
                </label>

                <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                    paymentMethod === "ONLINE" 
                        ? "bg-amber-500/10 border-amber-500" 
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}>
                    <div className="mt-1">
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="ONLINE"
                            checked={paymentMethod === "ONLINE"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 accent-amber-500"
                        />
                    </div>
                    <div>
                        <span className={`font-bold block mb-1 ${paymentMethod === "ONLINE" ? "text-amber-500" : "text-white"}`}>
                            💳 Thanh toán online
                        </span>
                        <p className="text-sm text-slate-400 leading-relaxed">Chuyển khoản an toàn qua ứng dụng ngân hàng / mã QR.</p>
                    </div>
                </label>
            </div>

            <button
                onClick={onCheckout}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] text-lg"
            >
                {paymentMethod === "ONLINE" ? "💳 CHUYỂN KHOẢN NGAY" : "🚀 XÁC NHẬN ĐẶT HÀNG"}
            </button>
        </div>
    );
}