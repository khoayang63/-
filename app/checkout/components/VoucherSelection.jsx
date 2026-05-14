import { useState, useEffect } from "react";
import { getReadClient } from "@/lib/supabase/read-client";

export default function VoucherSelection({ totalPrice, selectedVouchers, setSelectedVouchers }) {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVouchers = async () => {
            const supabase = getReadClient("sb-vouchers");
            const { data, error } = await supabase
                .from("vouchers")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (!error && data) {
                // Sắp xếp: percent -> fixed -> shipping, sau đó giảm dần theo discount_value
                const sortedVouchers = data.sort((a, b) => {
                    if (a.discount_type === b.discount_type) {
                        return Number(b.discount_value) - Number(a.discount_value);
                    }
                    const order = { "percent": 1, "fixed": 2, "shipping": 3 };
                    return (order[a.discount_type] || 99) - (order[b.discount_type] || 99);
                });
                setVouchers(sortedVouchers);
            }
            setLoading(false);
        };
        fetchVouchers();
    }, []);

    const handleToggleVoucher = (voucher) => {
        const isSelected = selectedVouchers.some((v) => v.id === voucher.id);
        if (isSelected) {
            setSelectedVouchers(selectedVouchers.filter((v) => v.id !== voucher.id));
        } else {
            setSelectedVouchers([...selectedVouchers, voucher]);
        }
    };

    if (loading) {
        return <div className="text-slate-400 text-sm animate-pulse">Đang tải mã giảm giá...</div>;
    }

    if (vouchers.length === 0) {
        return null; // Không có voucher nào để hiển thị
    }

    return (
        <div className="mb-8">
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <span className="text-amber-500">🎟️</span> Chọn mã giảm giá
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {vouchers.map((voucher) => {
                    const isSelected = selectedVouchers.some((v) => v.id === voucher.id);
                    // Kiểm tra xem đã chọn mã nào cùng loại chưa (và khác mã hiện tại)
                    const hasSelectedSameType = !isSelected && selectedVouchers.some((v) => v.discount_type === voucher.discount_type);
                    
                    const isOutOfStock = voucher.usage_limit && voucher.used_count >= voucher.usage_limit;
                    const isNotMetMinOrder = totalPrice < voucher.min_order;
                    const isDisabled = isOutOfStock || isNotMetMinOrder || hasSelectedSameType;

                    return (
                        <label
                            key={voucher.id}
                            className={`flex items-start gap-3 p-3 border rounded-xl transition-all ${
                                isDisabled 
                                    ? "bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed" 
                                    : isSelected
                                        ? "bg-amber-500/10 border-amber-500 cursor-pointer"
                                        : "bg-slate-950 border-slate-800 hover:border-slate-700 cursor-pointer"
                            }`}
                        >
                            <div className="mt-1">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => handleToggleVoucher(voucher)}
                                    className="w-4 h-4 accent-amber-500 rounded border-slate-700"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className={`font-bold text-sm ${isSelected ? "text-amber-500" : "text-slate-200"}`}>
                                        Mã: <span className="uppercase tracking-wider">{voucher.code}</span>
                                    </span>
                                    {voucher.usage_limit && (
                                        <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400 whitespace-nowrap">
                                            {voucher.used_count}/{voucher.usage_limit} đã dùng
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2">
                                    Giảm {voucher.discount_type === "fixed" 
                                        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(voucher.discount_value) 
                                        : voucher.discount_type === "percent"
                                            ? `${voucher.discount_value}%`
                                            : "phí vận chuyển"}
                                    {voucher.min_order > 0 && ` - Đơn tối thiểu ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(voucher.min_order)}`}
                                </p>
                                
                                {isOutOfStock && <p className="text-xs text-red-400 mt-1 font-medium">Đã hết lượt sử dụng</p>}
                                {!isOutOfStock && isNotMetMinOrder && <p className="text-xs text-amber-500/70 mt-1 font-medium">Chưa đạt giá trị đơn tối thiểu</p>}
                                {!isOutOfStock && !isNotMetMinOrder && hasSelectedSameType && <p className="text-xs text-slate-500 mt-1 font-medium">Chỉ được chọn 1 mã cùng loại</p>}
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
