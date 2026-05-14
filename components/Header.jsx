"use client"

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/app/auth/actions";
import { useState, useEffect, useRef } from "react";
import { getReadClient } from "@/lib/supabase/read-client";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const { cart } = useCart();
  const { user, profile, isAdmin } = useAuth();
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0)

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);


  // 🔥 Debounced Search
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setResults([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsDropdownOpen(true);

    const timer = setTimeout(async () => {
      try {
        const supabase = getReadClient("sb-search");
        const { data, error } = await supabase
          .from("figures")
          .select("id, name, price, old_price, thumbnail_url")
          .ilike("name", `%${searchTerm}%`)
          .limit(8);

        if (!error && data) {
          setResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      setIsSearching(false); // 🔥 reset khi huỷ
    };
  }, [searchTerm]);

  // 🔥 Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (id) => {
    router.push(`/products/${id}`);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };


  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10 shadow-lg w-full">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto gap-4">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <Image
            src="/tohka.webp"
            width={40}
            height={40}
            alt="logo"
            className="rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
          />
          <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-amber-400 transition-colors">
            TK shop
          </span>
        </Link>

        {/* SEARCH BAR */}
        <div className="flex-1 max-w-xl relative hidden md:block" ref={searchRef}>
          <div className="relative flex items-center w-full">
            <input
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-full pl-5 pr-10 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-slate-400 text-sm shadow-inner"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => results.length > 0 && setIsDropdownOpen(true)}
            />
            <span className="absolute right-4 text-slate-400 pointer-events-none">🔍</span>
          </div>

          {/* 🔥 RESULTS DROPDOWN */}
          {isDropdownOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-[9999] overflow-hidden max-h-[450px] overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-slate-400 text-sm italic animate-pulse">Đang tìm kiếm...</div>
              ) : results.length > 0 ? (
                results.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 cursor-pointer hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                    onClick={() => handleResultClick(item.id)}
                  >
                    <img
                      src={item.thumbnail_url || "https://placehold.co/50"}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-slate-200 truncate mb-1">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold text-xs">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.price || 0)}
                        </span>
                        {item.old_price > item.price && (
                          <span className="text-slate-500 line-through text-[10px]">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(item.old_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm italic">Không tìm thấy sản phẩm nào.</div>
              )}
            </div>
          )}
        </div>

        {/* AUTH & CART */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-sm font-medium text-slate-300">
            {user ? (
              <>
                <span className="text-slate-200">
                  Xin chào, <span className="text-amber-400">{profile?.full_name || "User"}</span>
                </span>
                <span className="text-slate-600">|</span>
                <Link href="/profile" className="hover:text-amber-400 transition-colors">
                  Hồ sơ
                </Link>

                {isAdmin && (
                  <>
                    <span className="text-slate-600">|</span>
                    <Link href="/admin" className="text-red-400 hover:text-red-300 font-bold transition-colors">
                      Admin
                    </Link>
                  </>
                )}

                <span className="text-slate-600">|</span>
                <form action={signOut}>
                  <button type="submit" className="hover:text-amber-400 transition-colors">
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-amber-400 transition-colors">
                  Đăng nhập
                </Link>
                <span className="text-slate-600">|</span>
                <Link href="/register" className="hover:text-amber-400 transition-colors">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
          
          <Link href="/cart" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20 text-sm">
            <span>🛒</span>
            <span>Giỏ hàng</span>
            <span className="bg-slate-900 text-amber-500 rounded-full px-2 py-0.5 text-xs ml-1">
              {totalQty}
            </span>
          </Link>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="bg-slate-950/50 border-t border-white/5 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-center items-center gap-8">
          <Link href="/" className="group relative py-4 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-amber-400 transition-colors">
            Trang chủ
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Link>
          <Link href="/products" className="group relative py-4 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-amber-400 transition-colors">
            Mô Hình / Figure
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Link>
          <Link href="/other-products" className="group relative py-4 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-amber-400 transition-colors">
            Sản phẩm khác
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Link>

          {/* Khuyến mãi */}
          <div className="group relative py-4 cursor-pointer">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-amber-400 transition-colors flex items-center gap-1">
              Khuyến mãi <span className="text-[10px] opacity-70 group-hover:rotate-180 transition-transform duration-300">▼</span>
            </span>
            <div className="absolute top-full left-0 mt-0 w-56 bg-slate-800 border border-slate-700 rounded-b-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
              <Link href="/promotions/flash-sale" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 border-b border-slate-700/50 transition-colors">Flash Sale!!!</Link>
              <Link href="/promotions/discount-codes" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-colors">Mã Giảm Giá</Link>
            </div>
          </div>

          {/* Hướng Dẫn */}
          <div className="group relative py-4 cursor-pointer">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-amber-400 transition-colors flex items-center gap-1">
              Hướng Dẫn <span className="text-[10px] opacity-70 group-hover:rotate-180 transition-transform duration-300">▼</span>
            </span>
            <div className="absolute top-full left-0 mt-0 w-56 bg-slate-800 border border-slate-700 rounded-b-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
              <Link href="/guides/buying-guide" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 border-b border-slate-700/50 transition-colors">Hướng Dẫn Mua Hàng</Link>
              <Link href="/guides/order-tracking" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 border-b border-slate-700/50 transition-colors">Hướng Dẫn Tra Cứu Đơn</Link>
              <Link href="/guides/pricing-guide" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 border-b border-slate-700/50 transition-colors">Hướng Dẫn Tính Giá Order</Link>
              <Link href="/guides/faq" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-colors">Câu Hỏi Thường Gặp</Link>
            </div>
          </div>

          {/* Tin Tức */}
          <div className="group relative py-4 cursor-pointer">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-amber-400 transition-colors flex items-center gap-1">
              Tin Tức <span className="text-[10px] opacity-70 group-hover:rotate-180 transition-transform duration-300">▼</span>
            </span>
            <div className="absolute top-full left-0 mt-0 w-56 bg-slate-800 border border-slate-700 rounded-b-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
              <Link href="/news" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 border-b border-slate-700/50 transition-colors">Tin Tức</Link>
              <Link href="/news/restock" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 border-b border-slate-700/50 transition-colors">Cập Nhật Hàng Về</Link>
              <Link href="/news/reviews" className="block px-5 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-colors">Review Sản Phẩm</Link>
            </div>
          </div>

          <Link href="/contact" className="group relative py-4 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-amber-400 transition-colors">
            Liên hệ
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Link>
        </div>
      </nav>
    </header>
  );
}