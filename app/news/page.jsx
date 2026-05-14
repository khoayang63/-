export default function NewsPage() {
    return (
        <div className="max-w-4xl mx-auto p-10 mt-10 text-center bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-orange-600 mb-4">Tin Tức</h1>
            <p className="text-gray-600 mb-6">Cập nhật tin tức mới nhất về các dòng figure và thị trường anime.</p>
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <span className="text-gray-400 font-medium">Đang tải tin tức...</span>
            </div>
        </div>
    );
}
