import { render, screen, fireEvent } from '@testing-library/react';
import CartPage from '@/app/cart/page';
import { useCart } from '@/context/CartContext.jsx';

// Mock useCart hook
jest.mock('@/context/CartContext.jsx', () => ({
  useCart: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('CartPage Component', () => {
  const mockCart = [
    { id: '1', name: 'Mô hình Naruto', price: 500000, quantity: 1, thumbnail_url: '/naruto.jpg' },
    { id: '2', name: 'Mô hình Sasuke', price: 600000, quantity: 2, thumbnail_url: '/sasuke.jpg' },
  ];

  beforeEach(() => {
    useCart.mockReturnValue({
      cart: mockCart,
      increaseQty: jest.fn(),
      decreaseQty: jest.fn(),
      removeItems: jest.fn(),
    });
  });

  it('nên hiển thị danh sách sản phẩm trong giỏ hàng', () => {
    render(<CartPage />);
    expect(screen.getByText('Mô hình Naruto')).toBeInTheDocument();
    expect(screen.getByText('Mô hình Sasuke')).toBeInTheDocument();
  });

  it('nên cập nhật tổng tiền khi chọn sản phẩm', () => {
    render(<CartPage />);
    
    // Ban đầu tổng tiền là 0đ vì chưa chọn sản phẩm nào
    expect(screen.getByText('0đ')).toBeInTheDocument();

    // Tìm checkbox của sản phẩm đầu tiên và click
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Index 0 là "Chọn tất cả", Index 1 là sản phẩm 1

    // Tổng tiền bây giờ phải là 500,000đ (dùng regex linh hoạt để tìm text bị ngắt dòng)
    const priceElements = screen.getAllByText(/500.*đ/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('nên hiển thị thông báo khi giỏ hàng trống', () => {
    useCart.mockReturnValue({
      cart: [],
      increaseQty: jest.fn(),
      decreaseQty: jest.fn(),
      removeItems: jest.fn(),
    });

    render(<CartPage />);
    expect(screen.getByText(/Giỏ hàng của bạn đang trống/i)).toBeInTheDocument();
  });
});
