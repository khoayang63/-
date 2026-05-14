"use client";

import Hero from "@/components/Hero";
import FeaturedSeries from "@/components/FeaturedSeries";
import FlashSale from "@/components/FlashSale";
import Categories from "@/components/Categories";
import LatestProducts from "@/components/LatestProducts";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Hero />
      <FeaturedSeries />
      <FlashSale />
      <Categories />
      <LatestProducts />
    </main>
  );
}