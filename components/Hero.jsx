import Link from "next/link";
// helloworld
export default function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-16 shadow-2xl border border-slate-800 bg-slate-900 group">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-amber-900/20 z-0"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl z-0 group-hover:bg-amber-500/30 transition-all duration-700"></div>

      <div className="relative z-10 py-24 px-8 md:px-16 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
          Thiên đường <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Mô Hình</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Khám phá bộ sưu tập Figure Anime chính hãng độc quyền.
          Nơi hội tụ đam mê của các Wibu chân chính với mức giá tốt nhất thị trường.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products" className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:-translate-y-1">
            Khám phá ngay
          </Link>
          <Link href="/promotions/flash-sale" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full border border-slate-700 hover:border-slate-600 transition-all hover:-translate-y-1">
            Xem khuyến mãi
          </Link>
        </div>
      </div>
    </div>
  );
}
