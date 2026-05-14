export default function FlashSalePage() {
    return (
        <div className="max-w-4xl mx-auto p-10 mt-10 text-center bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-red-600 mb-4">⚡ Flash Sale ⚡</h1>
            <p className="text-gray-600 mb-6">Săn deal chớp nhoáng với giá cực sốc. Chương trình sẽ diễn ra vào các dịp đặc biệt!</p>
            <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg border-2 border-dashed border-red-200">
                <span className="text-red-400 font-medium">Chưa có chương trình Flash Sale nào đang diễn ra</span>
            </div>
        </div>
    );
}
