import Link from "next/link";

export default function Categories() {
  const categories = [
    { name: "Game Prize Figure", icon: "🎮", slug: "game-prize" },
    { name: "Nendoroid", icon: "🧩", slug: "nendoroid" },
    { name: "Scale Figure", icon: "📏", slug: "scale" },
    { name: "Plush", icon: "🧸", slug: "plush" },
    { name: "Model Kit", icon: "🤖", slug: "model-kit" },
    { name: "Mini Figure", icon: "🤏", slug: "mini" },
    { name: "Blind Box", icon: "🎁", slug: "blind-box" },
    { name: "Phụ kiện", icon: "🎒", slug: "accessories" }
  ];

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
        <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
        <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white">Danh Mục Sản Phẩm</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((c, idx) => (
          <Link 
            href={`/products?category=${c.slug}`}
            key={idx} 
            className="flex items-center gap-4 px-5 py-4 bg-slate-900 border border-slate-800 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 rounded-2xl font-medium text-slate-300 text-left group no-underline decoration-transparent"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{c.icon}</span>
            <span className="group-hover:text-blue-400 font-semibold transition-colors">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
