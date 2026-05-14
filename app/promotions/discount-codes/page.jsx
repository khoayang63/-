export default function DiscountCodesPage() {
    return (
        <div className="max-w-4xl mx-auto p-10 mt-10 text-center bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-green-600 mb-4">Mã Giảm Giá</h1>
            <p className="text-gray-600 mb-6">Tổng hợp các voucher và mã giảm giá mới nhất dành cho khách hàng.</p>
            <div className="flex justify-center items-center h-64 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                <span className="text-green-500 font-medium">Đang cập nhật mã giảm giá...</span>
            </div>
        </div>
    );
}
