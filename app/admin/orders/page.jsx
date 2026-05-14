"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) {
      toast.error("Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (orderId, action) => {
    setActionLoading(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Thao tác thất bại");
        return;
      }

      toast.success(data.message);
      fetchOrders(); // Reload
    } catch (err) {
      toast.error("Lỗi xử lý đơn hàng");
    } finally {
      setActionLoading(null);
    }
  };

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusMap = {
    pending: { label: "Chờ duyệt", className: "status-pending" },
    confirmed: { label: "Đã xác nhận", className: "status-confirmed" },
    cancelled: { label: "Đã huỷ", className: "status-cancelled" },
  };

  const paymentStatusMap = {
    unpaid: { label: "Chưa thanh toán", className: "payment-unpaid" },
    processing: { label: "Đang xử lý", className: "payment-processing" },
    paid: { label: "Đã thanh toán", className: "payment-paid" },
    refunded: { label: "Đã hoàn tiền", className: "payment-refunded" },
  };

  if (loading) {
    return <div className="admin-page-loading">Đang tải đơn hàng...</div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý đơn hàng</h1>
        <span className="admin-page-count">{orders.length} đơn</span>
      </div>

      {orders.length === 0 ? (
        <div className="admin-empty">Chưa có đơn hàng nào</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="admin-order-id">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td>
                    <div className="admin-customer">
                      <span className="admin-customer-name">
                        {order.profiles?.full_name || "N/A"}
                      </span>
                      <span className="admin-customer-phone">
                        {order.phone_number}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-order-items">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="admin-order-item-row">
                          {item.figures?.name || "SP"} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="admin-amount">{formatVND(order.total_amount)}</td>
                  <td>
                    <span className={`admin-badge ${statusMap[order.status]?.className || ""}`}>
                      {statusMap[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${paymentStatusMap[order.payment_status]?.className || ""}`}>
                      {paymentStatusMap[order.payment_status]?.label || order.payment_status}
                    </span>
                  </td>
                  <td className="admin-date">{formatDate(order.created_at)}</td>
                  <td>
                    <div className="admin-actions">
                      {order.status === "pending" && (
                        <>
                          <button
                            className="admin-btn admin-btn-confirm"
                            disabled={actionLoading === order.id}
                            onClick={() => handleAction(order.id, "confirm")}
                          >
                            {actionLoading === order.id ? "..." : "✅ Duyệt"}
                          </button>
                          <button
                            className="admin-btn admin-btn-cancel"
                            disabled={actionLoading === order.id}
                            onClick={() => handleAction(order.id, "cancel")}
                          >
                            {actionLoading === order.id ? "..." : "❌ Huỷ"}
                          </button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <button
                          className="admin-btn admin-btn-cancel"
                          disabled={actionLoading === order.id}
                          onClick={() => handleAction(order.id, "cancel")}
                        >
                          {actionLoading === order.id ? "..." : "❌ Huỷ"}
                        </button>
                      )}
                      {order.status === "cancelled" && (
                        <span className="admin-text-muted">Đã huỷ</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
