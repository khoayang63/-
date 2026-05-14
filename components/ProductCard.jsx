import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl relative group overflow-hidden shadow-md hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/50 transition-all duration-300">
      <Link href={`/products/${product.id}`} className="relative overflow-hidden block bg-slate-950/50">
        <img
          src={product.thumbnail_url || "https://placehold.co/220"}
          alt={product.name}
          className="w-full h-64 object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* Overlay gradient for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>

        {product.discount !== 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white font-black text-xs px-2.5 py-1 rounded shadow-lg">
            -{product.discount}%
          </span>
        )}
        {product.order_type === "pre_order" && (
          <span className="absolute top-3 right-3 bg-amber-500 text-slate-900 font-black text-[10px] uppercase tracking-wider px-2 py-1 rounded shadow-lg">
            PRE-ORDER
          </span>
        )}
      </Link>
      
      <div className="flex-1 flex flex-col p-5">
        <Link href={`/products/${product.id}`} className="no-underline">
          <h3 className="font-semibold text-slate-200 line-clamp-2 mb-3 group-hover:text-amber-400 transition-colors" title={product.name}>
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto mb-4 flex items-baseline flex-wrap gap-2">
          <span className="text-xl font-black text-amber-500">
            {product.price.toLocaleString('vi-VN')}₫
          </span>
          {product.old_price !== product.price && (
            <span className="text-sm font-semibold text-slate-500 line-through">
              {product.old_price.toLocaleString('vi-VN')}₫
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className="bg-slate-800 text-white border border-slate-700 hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-all font-bold py-2.5 rounded-xl w-full flex items-center justify-center gap-2 group/btn relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:-translate-y-1 transition-transform"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            Thêm vào giỏ
          </span>
        </button>
      </div>
    </div>
  );
}
