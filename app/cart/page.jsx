"use client";

import { useCart } from "@/context/CartContext.jsx";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import Link from "next/link";

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeItems } = useCart();
  const [selectedItems, setSelectedItems] = useState([]);
  const router = useRouter();

  // ✅ Xóa item khỏi danh sách đã chọn nếu nó bị xóa khỏi giỏ
  useEffect(() => {
    setSelectedItems((prev) => prev.filter((id) => cart.some((item) => item.id === id)));
  }, [cart]);

  // ✅ chọn / bỏ chọn 1 item (theo id)
  const toggleItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  // ✅ chọn tất cả
  const toggleAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map((item) => item.id));
    }
  };

  // ✅ Tính tổng tiền và tổng số lượng (Tối ưu hóa độ phức tạp thành O(N))
  const selectedSet = new Set(selectedItems);
  const { totalPrice, totalQty } = cart.reduce(
    (acc, item) => {
      if (selectedSet.has(item.id)) {
        acc.totalPrice += (item.price * item.quantity) || 0;
        acc.totalQty += item.quantity || 0;
      }
      return acc;
    },
    { totalPrice: 0, totalQty: 0 }
  );

  const handleCheckout = async () => {
    const selectedCartItems = cart
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({
        id: item.id,
        thumbnail_url: item.thumbnail_url,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

    if (selectedCartItems.length === 0) {
      toast.error("Vui lòng chọn sản phẩm để thanh toán.");
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedCartItems }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Checkout failed");
        return;
      }

      router.push(`/checkout/${data.sessionId}`);
    } catch (err) {
      toast.error("Đã xảy ra sự cố. Vui lòng thử lại sau.");
      console.error(err);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 shadow-2xl flex flex-col items-center w-full">
          <div className="text-8xl mb-6 opacity-80">🛒</div>
          <h2 className="text-3xl font-bold text-white mb-4">Giỏ hàng của bạn đang trống</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng. Khám phá các figure cực đỉnh ngay hôm nay!
          </p>
          <Link href="/products" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)]">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 pb-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
          <span className="text-amber-500">🛒</span> Giỏ hàng
        </h1>
        <span className="bg-slate-800 text-slate-300 py-1.5 px-4 rounded-full text-sm font-medium border border-slate-700">
          {cart.length} sản phẩm
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side: Cart Items */}
        <div className="flex-1 w-full space-y-4">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center shadow-md">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={selectedItems.length === cart.length && cart.length > 0}
                  onChange={toggleAll}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 bg-slate-800 border border-slate-600 rounded flex items-center justify-center peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors">
                  <svg className="w-3 h-3 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="ml-3 font-medium text-slate-300 group-hover:text-white transition-colors">
                Chọn tất cả ({cart.length} sản phẩm)
              </span>
            </label>
          </div>

          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-all hover:border-slate-700 group">
                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 bg-slate-800 border border-slate-600 rounded flex items-center justify-center peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors">
                        <svg className="w-3 h-3 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </label>
                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={item.thumbnail_url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="flex-1 w-full flex flex-col justify-between h-full min-h-[128px]">
                  <div>
                    <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight mb-2 hover:text-amber-500 transition-colors">
                      <Link href={`/products/${item.id}`}>{item.name}</Link>
                    </h3>
                    <div className="text-xl font-extrabold text-amber-500 mb-4">
                      {item.price.toLocaleString()}đ
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 h-10">
                      <button 
                        onClick={() => decreaseQty(item.id)}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-l-lg transition-colors font-medium text-lg"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-white">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => increaseQty(item.id)}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-r-lg transition-colors font-medium text-lg"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                      onClick={() => {
                        if(confirm("Xoá sản phẩm này khỏi giỏ hàng?")) {
                          removeItems([item.id]);
                        }
                      }}
                      title="Xoá khỏi giỏ hàng"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Tóm tắt đơn hàng</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-slate-400">
              <span>Sản phẩm đã chọn:</span>
              <span className="font-medium text-white">{totalQty}</span>
            </div>
            <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-4">
              <span>Phí vận chuyển:</span>
              <span className="font-medium text-amber-500">Tính khi thanh toán</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-white">Tổng cộng:</span>
              <span className="text-2xl font-extrabold text-amber-500">
                {totalPrice.toLocaleString()}đ
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              className="w-full py-4 rounded-xl font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={selectedItems.length === 0}
              onClick={handleCheckout}
            >
              Thanh toán ({totalQty})
            </button>
            <button
              onClick={() => {
                removeItems(selectedItems);
                setSelectedItems([]);
              }}
              disabled={selectedItems.length === 0}
              className="w-full py-3 rounded-xl font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑 Xoá các mục đã chọn ({selectedItems.length})
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800">
            <Link href="/products" className="block text-center text-sm font-medium text-slate-400 hover:text-amber-500 transition-colors">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}