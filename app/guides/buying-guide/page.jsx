export default function BuyingGuidePage() {
    return (
        <div className="max-w-4xl mx-auto p-10 mt-10 text-center bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-blue-600 mb-4">Hướng Dẫn Mua Hàng</h1>
            <p className="text-gray-600 mb-6">Các bước chi tiết để mua hàng và thanh toán trên website của chúng tôi.</p>
            <div className="flex flex-col text-left gap-4 p-6 bg-blue-50 rounded-lg border border-blue-100">
                <p><strong>Bước 1:</strong> Tìm kiếm và chọn sản phẩm yêu thích.</p>
                <p><strong>Bước 2:</strong> Thêm vào giỏ hàng hoặc chọn Mua ngay.</p>
                <p><strong>Bước 3:</strong> Điền thông tin giao hàng và chọn phương thức thanh toán.</p>
                <p><strong>Bước 4:</strong> Xác nhận đơn hàng và chờ nhận hàng!</p>
            </div>
        </div>
    );
}
