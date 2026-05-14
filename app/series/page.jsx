"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getReadClient } from "@/lib/supabase/read-client";

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeries() {
      // Lấy toàn bộ series từ bảng 'series'
      const supabase = getReadClient("sb-series-list");
      const { data, error } = await supabase.from("series").select("*");
      if (error) {
        console.error("Lỗi tải series:", error.message);
      } else {
        setSeriesList(data || []);
      }
      setLoading(false);
    }
    fetchSeries();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold border-l-4 border-amber-500 pl-4 text-white uppercase">
          Tất cả Series
        </h1>
        <p className="mt-2 text-slate-400">Khám phá các bộ sưu tập mô hình theo từng series Anime/Manga yêu thích của bạn.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {seriesList.map((s) => (
            <Link href={`/series/${s.slug}`} key={s.id} className="flex flex-col items-center group">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-md group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 relative mb-3">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{
                    /* Cố gắng tải ảnh từ thư mục public dựa theo slug, nếu không có ảnh thì để hình giữ chỗ */
                    backgroundImage: `url(/series_images/${s.slug}.jpg), url(https://placehold.co/150)`
                  }}
                />
              </div>
              <p className="text-center font-semibold text-slate-300 group-hover:text-amber-500 transition-colors">
                {s.name}
              </p>
            </Link>
          ))}

          {seriesList.length === 0 && (
            <p className="col-span-full text-center text-slate-500 py-10">Chưa có dữ liệu Series nào.</p>
          )}
        </div>
      )}
    </main>
  );
}
