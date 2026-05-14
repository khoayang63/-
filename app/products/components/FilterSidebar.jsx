"use client";

import { useEffect, useState } from "react";

export default function FilterSidebar({ 
  figures = [],
  selectedBrands = [], 
  setSelectedBrands, 
  selectedPrice, 
  setSelectedPrice,
  setPage
}) {
  const brands = Array.from(
    new Set(figures.map((item) => item.brands?.name).filter(Boolean))
  ).sort();

  const priceRanges = [
    { value: "under-500", label: "Dưới 500.000đ" },
    { value: "500-1000", label: "500.000đ - 1.000.000đ" },
    { value: "1000-2000", label: "1.000.000đ - 2.000.000đ" },
    { value: "2000-5000", label: "2.000.000đ - 5.000.000đ" },
  ];

  const handleBrandChange = (brand) => {
    setPage?.(1);
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handlePriceChange = (price) => {
    setPage?.(1);
    setSelectedPrice(selectedPrice === price ? null : price);
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl sticky top-24">
      <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
        <span className="text-amber-500">⚙️</span> Bộ Lọc
      </h3>
      <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-800">
        Giúp tìm kiếm nhanh sản phẩm bạn cần
      </p>

      {/* Selected Tags */}
      {selectedBrands.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-800">
          {selectedBrands.map((brand, i) => (
            <div 
              key={i} 
              className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-500 border border-slate-700"
            >
              <span>{brand}</span>
              <button 
                onClick={() => handleBrandChange(brand)}
                className="ml-2 hover:text-red-500 transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            onClick={() => { setSelectedBrands([]); setPage?.(1); }}
            className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2 ml-1"
          >
            Xoá hết
          </button>
        </div>
      )}

      {/* Brands Filter */}
      <div className="mb-8">
        <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Thương hiệu</h4>
        <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 space-y-2.5">
          {brands.map((item, i) => (
            <label key={i} className="flex items-center group cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(item)}
                  onChange={() => handleBrandChange(item)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 bg-slate-800 border border-slate-600 rounded flex items-center justify-center peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors">
                  <svg className="w-3 h-3 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="ml-3 text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Mức giá</h4>
        <div className="space-y-3">
          {priceRanges.map((item, i) => (
            <label key={i} className="flex items-center group cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPrice === item.value}
                  onClick={() => handlePriceChange(item.value)}
                  onChange={() => {}}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center peer-checked:border-amber-500 transition-colors">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <span className="ml-3 text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}