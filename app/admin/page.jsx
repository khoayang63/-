"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  if (loading) {
    return <div className="admin-page-loading">Đang tải thống kê...</div>;
  }

  if (!stats) {
    return <div className="admin-page-loading">Không thể tải dữ liệu</div>;
  }

  const cards = [
    { label: "Tổng đơn hàng", value: stats.totalOrders, icon: "📦", color: "#3b82f6" },
    { label: "Đơn chờ duyệt", value: stats.pendingOrders, icon: "⏳", color: "#f59e0b" },
    { label: "Đã xác nhận", value: stats.confirmedOrders, icon: "✅", color: "#10b981" },
    { label: "Đã huỷ", value: stats.cancelledOrders, icon: "❌", color: "#ef4444" },
    { label: "Đã thanh toán", value: stats.paidOrders, icon: "💳", color: "#8b5cf6" },
    { label: "Doanh thu", value: formatVND(stats.totalRevenue), icon: "💰", color: "#059669" },
    { label: "Tổng sản phẩm", value: stats.totalProducts, icon: "🏷️", color: "#6366f1" },
    { label: "Hết hàng", value: stats.outOfStock, icon: "🚫", color: "#dc2626" },
  ];

  return (
    <div>
      <h1 className="admin-page-title">Tổng quan</h1>

      <div className="admin-stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card" style={{ borderTopColor: card.color }}>
            <div className="admin-stat-icon">{card.icon}</div>
            <div className="admin-stat-value">{card.value}</div>
            <div className="admin-stat-label">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
