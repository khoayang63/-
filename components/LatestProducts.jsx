import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

export default function LatestProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?sort=latest&limit=8")
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>
  );
  if (products.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
        <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
        <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white">Mô Hình Mới Nhất</h2>
        <Link href="/products" className="ml-auto text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
          Xem tất cả <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
      
      <div className="mt-12 flex justify-center">
        <Link 
          href="/products" 
          className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-slate-900 bg-amber-500 rounded-full overflow-hidden transition-all hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
        >
          <span className="relative z-10 flex items-center gap-2">
            Khám phá toàn bộ bộ sưu tập
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </span>
        </Link>
      </div>
    </section>
  );
}
