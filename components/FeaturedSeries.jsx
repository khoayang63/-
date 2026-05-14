import Link from 'next/link';

export default function FeaturedSeries() {
  const seriesList = [
    { name: "Hatsune Miku", slug: "hatsune-miku", image: "/series_images/hatsune-miku.jpg" },
    { name: "One Piece", slug: "one-piece", image: "/series_images/one-piece.jpg" },
    { name: "Demon Slayer", slug: "demon-slayer", image: "/series_images/demon-slayer.jpg" },
    { name: "Hololive", slug: "hololive", image: "/series_images/hololive.jpg" },
    { name: "Fate Grand Order", slug: "fate-grand-order", image: "/series_images/fate-grand-order.jpg" },
    { name: "Spy X Family", slug: "spy-x-family", image: "/series_images/spy-x-family.jpg" },
  ];

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
        <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
        <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white">Series Nổi Bật</h2>
        <Link href="/series" className="ml-auto text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
          Xem tất cả <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {seriesList.map((s, idx) => (
          <Link href={`/series/${s.slug}`} key={idx} className="flex-shrink-0 w-36 cursor-pointer group snap-start">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-slate-800 shadow-xl group-hover:border-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 mb-4 relative bg-slate-900">
              <div
                className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `url(${s.image}), url(https://placehold.co/150)` }}
              />
            </div>
            <p className="text-center font-bold text-sm text-slate-300 group-hover:text-amber-500 transition-colors">{s.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
