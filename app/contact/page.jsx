export default function ContactPage() {
    return (
        <div className="max-w-4xl mx-auto p-10 mt-10 bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Liên Hệ Với Chúng Tôi</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Thông Tin Liên Hệ</h2>
                    <ul className="space-y-4 text-gray-600">
                        <li>📍 <strong>Địa chỉ:</strong> 123 Đường Anime, Quận Manga, TP. HCM</li>
                        <li>📞 <strong>Hotline:</strong> 0123.456.789</li>
                        <li>✉️ <strong>Email:</strong> support@tkshop.vn</li>
                        <li>🕒 <strong>Giờ làm việc:</strong> 9:00 AM - 9:00 PM (Thứ 2 - Chủ Nhật)</li>
                    </ul>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Gửi Tin Nhắn</h2>
                    <form className="space-y-4">
                        <input type="text" placeholder="Họ và tên" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-yellow-500" />
                        <input type="email" placeholder="Email" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-yellow-500" />
                        <textarea placeholder="Nội dung tin nhắn..." rows="4" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-yellow-500"></textarea>
                        <button type="button" className="w-full bg-yellow-500 text-white font-semibold p-3 rounded-lg hover:bg-yellow-600 transition">Gửi Liên Hệ</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
