"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminProducts() {
  const router = useRouter();
  const [figures, setFigures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [stock, setStock] = useState("");
  const [sort, setSort] = useState("newest");

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Jump page state
  const [jumpPage, setJumpPage] = useState("");

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams({
      page,
      limit: 20,
      search,
      type,
      stock,
      sort
    }).toString();

    fetch(`/api/admin/products?${query}`)
      .then((res) => res.json())
      .then((data) => {
        setFigures(data.figures || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Lỗi tải sản phẩm");
        setLoading(false);
      });
  }, [page, search, type, stock, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400); // Debounce search

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/admin/products/${deletingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Đã xoá sản phẩm");
        fetchProducts();
      } else {
        toast.error("Lỗi khi xoá sản phẩm");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý sản phẩm</h1>
        <span className="admin-page-count">{total} sản phẩm</span>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/admin/products/new" className="admin-btn-add">
            <span>+</span> Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="admin-filters">
          <select
            className="admin-select"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại</option>
            <option value="available">Có sẵn</option>
            <option value="pre_order">Pre-order</option>
          </select>

          <select
            className="admin-select"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả tồn kho</option>
            <option value="in_stock">Còn hàng</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>

          <select
            className="admin-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="admin-page-loading">Đang tải sản phẩm...</div>
      ) : figures.length === 0 ? (
        <div className="admin-empty">Không tìm thấy sản phẩm nào</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên sản phẩm / Brand</th>
                <th>Giá</th>
                <th>Loại</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {figures.map((fig) => (
                <tr key={fig.id}>
                  <td>
                    {fig.thumbnail_url ? (
                      <img
                        src={fig.thumbnail_url}
                        alt={fig.name}
                        className="admin-product-img"
                      />
                    ) : (
                      <div className="admin-product-img-placeholder">📷</div>
                    )}
                  </td>
                  <td>
                    <div className="admin-product-name">{fig.name}</div>
                    <div className="admin-product-brand">{fig.brands?.name || "—"}</div>
                  </td>
                  <td className="admin-amount">{formatVND(fig.price)}</td>
                  <td>
                    <span className={`admin-badge ${fig.order_type === "available" ? "status-confirmed" : "status-pending"}`}>
                      {fig.order_type === "available" ? "Có sẵn" : "Pre-order"}
                    </span>
                  </td>
                  <td>
                    {fig.order_type === "available" ? (
                      <span className={fig.stock_quantity <= 0 ? "admin-text-danger" : ""}>
                        {fig.stock_quantity}
                      </span>
                    ) : (
                      <span className="admin-text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {fig.order_type === "available" && fig.stock_quantity <= 0 ? (
                      <span className="admin-badge status-cancelled">Hết hàng</span>
                    ) : fig.order_type === "pre_order" ? (
                      <span className="admin-badge status-pending">Chờ nhập hàng</span>
                    ) : (
                      <span className="admin-badge status-confirmed">Còn hàng</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-actions-cell">
                      <Link href={`/admin/products/${fig.id}/edit`} className="admin-btn-icon admin-btn-edit" title="Sửa">
                        ✏️
                      </Link>
                      <button
                        className="admin-btn-icon admin-btn-delete"
                        title="Xoá"
                        onClick={() => {
                          setDeletingId(fig.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PHÂN TRANG */}
      <div className="admin-pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="admin-btn-page"
        >
          Trang trước
        </button>

        <span className="admin-page-info">
          Trang <strong>{page}</strong> / {totalPages}
        </span>

        <div className="admin-jump-page">
          <span>Đi đến:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const p = parseInt(jumpPage);
                if (p >= 1 && p <= totalPages) {
                  setPage(p);
                  setJumpPage("");
                } else {
                  toast.error(`Vui lòng nhập từ 1 đến ${totalPages}`);
                }
              }
            }}
            placeholder="..."
            className="admin-jump-input"
          />
        </div>

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="admin-btn-page"
        >
          Trang sau
        </button>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Xác nhận xoá</h3>
            <p>Bạn có chắc chắn muốn xoá sản phẩm này không? Hành động này không thể hoàn tác.</p>
            <div className="admin-modal-actions">
              <button className="admin-btn-page" onClick={() => setShowDeleteModal(false)}>Huỷ</button>
              <button
                className="admin-btn"
                style={{ background: "#ef4444", color: "white" }}
                onClick={handleDelete}
              >
                Xoá ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
