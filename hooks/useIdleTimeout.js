'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { signOut } from '@/app/auth/actions';
import { useAuth } from '@/context/AuthContext';



/**
 * Hook quản lý thời gian rảnh (idle timeout) của người dùng
 * @param {number} timeoutMinutes Thời gian tính bằng phút trước khi hết hạn session
 */
export default function useIdleTimeout(timeoutMinutes = 15) {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const { user } = useAuth();
  const timeoutIdRef = useRef(null);
  const router = useRouter();


  // Hàm xử lý khi hết thời gian
  const handleLogout = useCallback(async () => {
    if (!user) return;

    setIsSessionExpired(true);

    // 🚪 Đăng xuất via Server Action
    try {
      await signOut();
    } catch {
      // signOut redirects, which throws NEXT_REDIRECT — safe to ignore
    }

    toast.error("Phiên làm việc hết hạn do bạn không tương tác!", {
      duration: 2000,
      icon: '⏳',
    });
  }, [user]);


  // Hàm reset lại đồng hồ đếm ngược mỗi khi người dùng tương tác
  const resetTimeout = useCallback(() => {
    if (!user) return; // 👈 Nếu không có user thì không đếm giờ

    if (timeoutIdRef.current) {

      clearTimeout(timeoutIdRef.current);
    }

    // Nếu session đã hết hạn rồi thì không đếm lại nữa (phải đăng nhập lại)
    if (isSessionExpired) return;

    // Đặt giờ mới
    timeoutIdRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMinutes * 60 * 1000); // Đổi phút sang milliseconds
  }, [timeoutMinutes, isSessionExpired, handleLogout, user]);

  // 🛡️ Tự động xoá trạng thái hết hạn nếu bỗng nhiên thấy user (đăng nhập thành công)
  if (user && isSessionExpired) {
    setIsSessionExpired(false);
  }

  useEffect(() => {
    // Các hành động được coi là "người dùng đang tương tác"
    const events = [
      'mousedown',
      'keydown',
      'touchstart'
    ];

    const handleUserActivity = () => {
      resetTimeout();
    };

    // Gắn sự kiện lắng nghe lên toàn bộ document
    events.forEach(event => document.addEventListener(event, handleUserActivity));

    // Bắt đầu đếm giờ ngay lần đầu tiên component được render
    resetTimeout();

    // Dọn dẹp sự kiện khi component bị hủy (tránh rò rỉ bộ nhớ)
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      events.forEach(event => document.removeEventListener(event, handleUserActivity));
    };
  }, [resetTimeout]);

  // Hàm để đóng modal và chuyển hướng về trang đăng nhập
  const closeSessionModal = async () => {
    setIsSessionExpired(false);
    router.push('/login');
  };

  return { isSessionExpired, closeSessionModal };
}
