"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/app/products/components/FilterSidebar";
import ProductGrid from "@/app/products/components/ProductGrid";
import SortBar from "@/app/products/components/SortBar";
import { getReadClient } from "@/lib/supabase/read-client";

export default function SeriesDetailPage({ params }) {
  const { slug } = use(params);

  const [seriesInfo, setSeriesInfo] = useState(null);
  const [figures, setFigures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("a-z");

  // 🔥 FILTER STATE
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);

  // 🔥 WINDOW
  const [currentWindow, setCurrentWindow] = useState(0);

  const itemsPerPage = 12;
  const windowSize = 10;

  const router = useRouter();
  const searchParams = useSearchParams();

  // 🔥 HANDLE SEARCH PARAMS
  useEffect(() => {
    const page = searchParams.get("page");
    const sortby = searchParams.get("sortby");

    if (!page || !sortby) {
      const p = new URLSearchParams(searchParams);

      if (!page) p.set("page", "1");
      if (!sortby) p.set("sortby", "a-z");

      const newQuery = p.toString();
      const currentQuery = searchParams.toString();

      // 🔥 chỉ replace khi khác
      if (newQuery !== currentQuery) {
        router.replace(`?${newQuery}`, { scroll: false });
      }
      return;
    }

    setCurrentPage(Number(page));
    setSortBy(sortby);
  }, [searchParams, router]);

  // 🔥 HANDLE SORT CHANGE
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);

    const p = new URLSearchParams(searchParams);
    p.set("sortby", newSort);
    p.set("page", "1");
    router.push(`?${p.toString()}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const p = new URLSearchParams(searchParams);
    p.set("page", page.toString());
    p.set("sortby", sortBy);
    router.push(`?${p.toString()}`);
  };

  // 📡 FETCH DATA
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const res = await fetch(`/api/series/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch series data");
        const data = await res.json();

        if (!ignore) {
          setSeriesInfo(data.seriesInfo);
          setFigures(data.figures || []);
        }
      } catch (err) {
        console.error("❌ Error fetching series data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [slug]);

  // 🎯 FILTER
  const filteredFigures = figures.filter((item) => {
    if (selectedBrands.length > 0 && !selectedBrands.includes(item.brands?.name)) {
      return false;
    }

    if (selectedPrice) {
      const price = item.price || 0;
      switch (selectedPrice) {
        case "under-500":
          return price < 500000;
        case "500-1000":
          return price >= 500000 && price < 1000000;
        case "1000-2000":
          return price >= 1000000 && price < 2000000;
        case "2000-5000":
          return price >= 2000000 && price <= 5000000;
        default:
          return true;
      }
    }

    return true;
  });

  // 📦 SORT
  const sortedFigures = [...filteredFigures].sort((a, b) => {
    switch (sortBy) {
      case "a-z":
        return a.name?.localeCompare(b.name || "") || 0;
      case "z-a":
        return b.name?.localeCompare(a.name || "") || 0;
      case "price-asc":
        return (a.price || 0) - (b.price || 0);
      case "price-desc":
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });

  // 📦 PAGINATION DATA
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFigures = sortedFigures.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedFigures.length / itemsPerPage);

  // 🔥 WINDOW CALC
  const startPage = currentWindow * windowSize + 1;
  const endPage = Math.min(startPage + windowSize - 1, totalPages);

  // 🔥 SYNC WINDOW
  useEffect(() => {
    const newWindow = Math.floor((currentPage - 1) / windowSize);
    setCurrentWindow(newWindow);
  }, [currentPage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!seriesInfo) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl font-bold text-gray-700">Series không tồn tại!</h1>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Premium Header */}
      <div className="mb-12 bg-slate-900 rounded-3xl p-8 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Series: <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 uppercase">{seriesInfo.name}</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">Khám phá các sản phẩm nổi bật thuộc series {seriesInfo.name}.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <FilterSidebar
          figures={figures}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          selectedPrice={selectedPrice}
          setSelectedPrice={setSelectedPrice}
          setPage={setCurrentPage}
        />

        <div className="flex-1 w-full">
          {!loading && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
                <h2 className="text-xl font-bold text-white">
                  Danh sách sản phẩm <span className="text-amber-500 text-sm font-medium ml-2">({filteredFigures.length} kết quả)</span>
                </h2>

                <SortBar
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  onSortChange={handleSortChange}
                />
              </div>

              {currentFigures.length > 0 ? (
                <ProductGrid figures={currentFigures} />
              ) : (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-slate-300 mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-slate-500">Vui lòng thử điều chỉnh lại bộ lọc của bạn.</p>
                </div>
              )}

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 mb-8">
                  {currentWindow > 0 && (
                    <button
                      onClick={() => setCurrentWindow(currentWindow - 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-colors font-bold"
                    >
                      «
                    </button>
                  )}

                  {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                    const page = startPage + i;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg border font-bold transition-colors ${
                          currentPage === page
                            ? "bg-amber-500 text-slate-900 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                            : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {endPage < totalPages && (
                    <button
                      onClick={() => setCurrentWindow(currentWindow + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-colors font-bold"
                    >
                      »
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
