"use client";

import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ figures }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {figures.map((item) => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}