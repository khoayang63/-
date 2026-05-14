import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

export default function FlashSale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 45, s: 10 });

  const formatTime = (n) => n.toString().padStart(2, '0');

  useEffect(() => {
    // Lấy 4 sản phẩm ngẫu nhiên để làm Flash Sale
    fetch("/api/products?limit=4")
      .then(res => res.json())
      .then(data => {
        // Giả lập discount cho hấp dẫn
        const saleProducts = (data.products || []).map(p => ({
          ...p,
          oldPrice: p.price * 1.25,
          discount: 20
        }));
        setProducts(saleProducts);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else if (m > 0) { s = 59; m--; }
        else if (h > 0) { s = 59; m = 59; h--; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <section className="mb-16 bg-slate-900 p-6 md:p-8 rounded-3xl border border-red-900/30 shadow-2xl relative overflow-hidden group">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 translate-x-1/3 -translate-y-1/3 group-hover:opacity-20 transition-opacity duration-1000"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 relative z-10 gap-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 flex items-center gap-3 tracking-tight">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          FLASH SALE
        </h2>
        <div className="flex items-center gap-3 bg-slate-950 px-5 py-2.5 rounded-xl shadow-inner border border-slate-800">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Kết thúc trong:</span>
          <div className="flex gap-1.5 items-center font-mono">
            <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-base font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]">{formatTime(timeLeft.h)}</span>
            <span className="text-red-500 font-bold text-lg">:</span>
            <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-base font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]">{formatTime(timeLeft.m)}</span>
            <span className="text-red-500 font-bold text-lg">:</span>
            <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-base font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">{formatTime(timeLeft.s)}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
