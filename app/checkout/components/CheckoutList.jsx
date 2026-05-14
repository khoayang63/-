import CheckoutItem from "./CheckoutItem";

export default function CheckoutList({ cart }) {
    return (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="text-amber-500">📦</span> Sản phẩm
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {cart.map((item) => (
                    <CheckoutItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}