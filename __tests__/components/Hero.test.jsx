import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

describe('Hero Component', () => {
  it('nên hiển thị tiêu đề chính xác', () => {
    render(<Hero />);
    // Tìm text "Thiên đường" (phần đầu của h1)
    const headingPart = screen.getByText(/Thiên đường/i);
    expect(headingPart).toBeInTheDocument();
  });

  it('nên hiển thị phần text nhấn mạnh "Mô Hình"', () => {
    render(<Hero />);
    const highlightedText = screen.getByText(/Mô Hình/i);
    expect(highlightedText).toBeInTheDocument();
    expect(highlightedText).toHaveClass('text-transparent');
  });

  it('nên có nút "Khám phá ngay" trỏ đến đúng trang', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /Khám phá ngay/i });
    expect(link).toHaveAttribute('href', '/products');
  });
});
