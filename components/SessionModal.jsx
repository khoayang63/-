'use client';

import useIdleTimeout from '../hooks/useIdleTimeout';

export default function SessionModal() {
  // Cài đặt thời gian timeout ở đây (ví dụ: 15 phút)
  // Bạn có thể đổi số 15 thành thời gian bạn muốn
  const { isSessionExpired, closeSessionModal } = useIdleTimeout(5);

  // Nếu chưa hết hạn thì không hiển thị gì cả
  if (!isSessionExpired) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-md transition-opacity">

      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-center transform transition-all scale-100 opacity-100">

        {/* Icon cảnh báo */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">Phiên đã hết hạn</h3>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Bạn đã không có thao tác nào trong một thời gian dài để bảo mật. Vui lòng đăng nhập lại để tiếp tục.
        </p>

        <button
          onClick={closeSessionModal}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Đăng nhập lại ngay
        </button>
      </div>
    </div>
  );
}
