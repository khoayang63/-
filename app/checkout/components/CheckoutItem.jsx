export default function CheckoutItem({ item }) {
    return (
        <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                <img
                    src={item.thumbnail_url}
                    alt={item.name}
                    className="w-full h-full object-contain"
                />
            </div>

            <div className="flex-1 min-w-0">
                <p className="line-clamp-2 font-semibold text-white text-sm mb-1">{item.name}</p>
                <p className="text-amber-500 font-medium text-xs">
                    Số lượng: <span className="text-white">x{item.quantity}</span>
                </p>
            </div>

            <div className="font-bold text-amber-500 whitespace-nowrap">
                {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                }).format(item.price)}
            </div>
        </div>
    );
}