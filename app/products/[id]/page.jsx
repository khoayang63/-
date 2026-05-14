"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReadClient } from "@/lib/supabase/read-client";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);

  // States cho các option (Mock data)
  const [quantity, setQuantity] = useState(1);
  const [boxType, setBoxType] = useState("HỘP ĐẸP");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product data");
        
        const { product: figureData, images: imagesData } = await res.json();

        setProduct(figureData);

        const allImages = [
          figureData.thumbnail_url || "https://placehold.co/600",
          ...imagesData.map((img) => img.image_url),
        ].filter(Boolean);

        const uniqueImages = [...new Set(allImages)];

        setImages(uniqueImages);
        setMainImage(uniqueImages[0]);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    toast.success(`Đã thêm ${quantity} x ${product.name} vào giỏ!`);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    try {
      const items = [{
        id: product.id,
        thumbnail_url: product.thumbnail_url,
        name: product.name,
        price: product.price,
        quantity: quantity,
      }];

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Không thể khởi tạo thanh toán");
        return;
      }

      router.push(`/checkout/${data.sessionId}`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi hệ thống");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-slate-900 mx-4 my-10 rounded-3xl border border-slate-800">
        <div className="text-6xl mb-6">🕵️‍♂️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-slate-400 mb-8">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
        <Link href="/products" className="bg-amber-500 text-slate-900 font-bold px-8 py-3 rounded-full hover:bg-amber-400 transition-colors">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link href="/" className="hover:text-amber-500 transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-amber-500 transition-colors">Sản phẩm</Link>
        <span>/</span>
        <span className="text-slate-300 truncate">{product.name}</span>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-amber-900/10 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          
          {/* ================= LEFT: IMAGE GALLERY ================= */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center aspect-square group">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Status Badge */}
              <span
                className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg z-10
                  ${product.order_type === "pre_order"
                    ? "bg-amber-500 text-slate-900"
                    : product.stock_status === "in_stock"
                      ? "bg-green-500 text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}
              >
                {product.order_type === "pre_order"
                  ? "PRE-ORDER"
                  : product.stock_status === "in_stock"
                    ? "IN STOCK"
                    : "OUT OF STOCK"}
              </span>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-950 transition-all border-2
                    ${mainImage === img ? "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100"}
                  `}
                >
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ================= RIGHT: PRODUCT INFO ================= */}
          <div className="lg:col-span-7 flex flex-col">
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Tình trạng:</span>
                <span className={`font-semibold ${
                    product.order_type === "pre_order" ? "text-amber-500" : 
                    product.stock_status === "in_stock" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {product.order_type === "pre_order" ? "Pre-order" : 
                   product.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Thương hiệu:</span>
                <span className="text-white font-medium hover:text-amber-500 cursor-pointer transition-colors">{product.brands?.name || "Đang cập nhật"}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Loại:</span>
                <span className="text-white font-medium hover:text-amber-500 cursor-pointer transition-colors">{product.categories?.name || "Figure"}</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800 mb-8 flex flex-wrap items-baseline gap-4">
              <span className="text-4xl font-black text-amber-500 tracking-tight">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
              {product.old_price > product.price && (
                <span className="text-xl text-slate-500 line-through font-semibold">
                  {product.old_price.toLocaleString("vi-VN")}₫
                </span>
              )}
              {product.discount > 0 && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold ml-auto sm:ml-0 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                  -{product.discount}%
                </span>
              )}
            </div>

            {/* Options */}
            <div className="space-y-6 mb-8">
              {/* Box Type */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <span className="w-24 text-slate-400 font-medium">Phân Loại:</span>
                <div className="flex flex-wrap gap-3">
                  {["HỘP ĐẸP", "HỘP MÓP NHẸ"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setBoxType(type)}
                      className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 overflow-hidden
                        ${boxType === type 
                          ? "border-amber-500 text-amber-500 bg-amber-500/10" 
                          : "border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-800"}
                      `}
                    >
                      {type}
                      {boxType === type && (
                        <span className="absolute bottom-0 right-0 w-6 h-6 bg-amber-500 text-slate-900 flex items-center justify-center rounded-tl-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <span className="w-24 text-slate-400 font-medium">Số lượng:</span>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl h-12 w-36 overflow-hidden">
                  <button onClick={handleDecrease} className="w-12 h-full flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xl font-medium focus:outline-none">
                    -
                  </button>
                  <div className="flex-1 h-full flex items-center justify-center bg-slate-900 border-x border-slate-700 font-bold text-white">
                    {quantity}
                  </div>
                  <button onClick={handleIncrease} className="w-12 h-full flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xl font-medium focus:outline-none">
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                onClick={handleBuyNow}
                disabled={product.stock_status === "out_of_stock" && product.order_type !== "pre_order"}
                className={`flex-1 font-bold text-lg py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2
                  ${product.stock_status === "out_of_stock" && product.order_type !== "pre_order"
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-amber-500 text-slate-900 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  }`}
              >
                {product.order_type === "pre_order" ? "ĐẶT TRƯỚC NGAY" : 
                 product.stock_status === "out_of_stock" ? "HẾT HÀNG" : "MUA NGAY"}
              </button>
              
              <button
                onClick={handleAddToCart}
                disabled={product.stock_status === "out_of_stock" && product.order_type !== "pre_order"}
                className={`sm:w-48 border-2 py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-bold
                  ${product.stock_status === "out_of_stock" && product.order_type !== "pre_order"
                    ? "border-slate-700 text-slate-500 bg-slate-800 cursor-not-allowed"
                    : "border-slate-700 text-white bg-slate-800 hover:bg-slate-700 hover:border-slate-500"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                Thêm vào giỏ
              </button>
            </div>

            {/* Promo Codes */}
            <div className="border border-amber-500/30 rounded-2xl overflow-hidden bg-amber-500/5 mt-auto">
              <div className="bg-amber-500/10 px-5 py-3 flex items-center gap-3 border-b border-amber-500/20">
                <span className="text-xl">🎁</span>
                <span className="font-bold text-amber-500 uppercase tracking-wide text-sm">Ưu Đãi Đặc Biệt</span>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-300">
                    Nhập <strong className="text-amber-400 font-mono px-1">MF1</strong> giảm ngay 20K cho đơn {">"}500K
                  </p>
                  <button className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                    Sao chép
                  </button>
                </div>

                <div className="h-px border-t border-dashed border-slate-700 w-full"></div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-300">
                    Nhập <strong className="text-amber-400 font-mono px-1">FREESHIP50</strong> miễn phí vận chuyển
                  </p>
                  <button className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                    Sao chép
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Description Box */}
      {product.description && (
        <div className="mt-8 bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Mô tả sản phẩm</h2>
          </div>
          <div
            className="prose prose-invert prose-slate max-w-none 
              prose-headings:text-amber-500 prose-a:text-blue-400 hover:prose-a:text-blue-300
              prose-img:rounded-xl prose-img:border prose-img:border-slate-800"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

    </div>
  );
}
