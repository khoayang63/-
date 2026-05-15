// This is a small comment to test the CI pipeline on the update branch
export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🛍️</span> TK shop
          </h3>
          <p className="text-sm leading-relaxed">
            Chuyên cung cấp mô hình anime chính hãng từ các nhãn hàng hàng đầu. Cam kết chất lượng và dịch vụ tốt nhất.
          </p>
          <div className="flex gap-3 mt-2">
            <span className="bg-slate-900 hover:bg-amber-500 hover:text-slate-900 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-slate-800 hover:border-amber-500">Facebook</span>
            <span className="bg-slate-900 hover:bg-amber-500 hover:text-slate-900 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-slate-800 hover:border-amber-500">Instagram</span>
            <span className="bg-slate-900 hover:bg-amber-500 hover:text-slate-900 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-slate-800 hover:border-amber-500">Twitter</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
            <span>📍</span> Thông tin liên hệ
          </h4>
          <p className="text-sm hover:text-white cursor-pointer transition-colors flex items-center gap-2">
            <span className="opacity-50">📧</span> info@tkshop.com
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="opacity-50">🕐</span> Giờ mở cửa: 8AM - 10PM
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="opacity-50">📦</span> Hỗ trợ đặt hàng trực tuyến 24/7
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
            <span>ℹ️</span> Hỗ trợ khách hàng
          </h4>
          <p className="text-sm hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-2">
            <span className="text-amber-500/50">✓</span> Hướng dẫn mua hàng
          </p>
          <p className="text-sm hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-2">
            <span className="text-amber-500/50">✓</span> Chính sách đổi trả
          </p>
          <p className="text-sm hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-2">
            <span className="text-amber-500/50">✓</span> Bảo hành sản phẩm
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
            <span>🎁</span> Dành cho bạn
          </h4>
          <p className="text-sm flex items-center gap-2">
            <span className="text-amber-500/50">✓</span> Miễn phí vận chuyển cho đơn hàng trên 500K
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="text-amber-500/50">✓</span> Hàng chính hãng 100%
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="text-amber-500/50">✓</span> Quà tặng khi mua hàng
          </p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500 tracking-wide text-center md:text-left">
          © {new Date().getFullYear()} TK shop - Tất cả quyền được bảo lưu
        </p>
        <div className="text-xs text-slate-500 flex gap-4">
          <span className="hover:text-white cursor-pointer transition-colors">Điều khoản</span>
          <span className="hover:text-white cursor-pointer transition-colors">Bảo mật</span>
        </div>
      </div>
    </footer>
  );
}