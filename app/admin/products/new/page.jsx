"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    brand_id: "",
    order_type: "available",
    stock_quantity: "0",
    description: "",
    thumbnail_url: "",
  });

  const [uploading, setUploading] = useState(false);

  // Lấy danh sách brands cho dropdown
  useEffect(() => {
    fetch("/api/admin/brands")
      .then(res => res.json())
      .then(data => setBrands(data.brands || []))
      .catch(() => toast.error("Không thể tải danh sách thương hiệu"));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (res.ok) {
        setFormData({ ...formData, thumbnail_url: result.url });
        toast.success("Upload ảnh thành công");
      } else {
        toast.error(result.error || "Lỗi upload");
      }
    } catch (error) {
      toast.error("Lỗi kết nối upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Đã thêm sản phẩm thành công!");
        router.push("/admin/products");
      } else {
        toast.error(result.error || "Lỗi khi lưu sản phẩm");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <Link href="/admin/products" style={{ textDecoration: "none", color: "inherit" }}>🏷️ Sản phẩm</Link> 
          <span style={{ margin: "0 10px", color: "#94a3b8" }}>/</span>
          Thêm mới
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card">
        <div className="admin-form-grid">
          {/* Tên sản phẩm */}
          <div className="admin-form-group full-width">
            <label>Tên sản phẩm *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Figure Monkey D. Luffy Gear 5"
            />
          </div>

          {/* Giá */}
          <div className="admin-form-group">
            <label>Giá (VNĐ) *</label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
            />
          </div>

          {/* Thương hiệu */}
          <div className="admin-form-group">
            <label>Thương hiệu</label>
            <select
              value={formData.brand_id}
              onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
            >
              <option value="">-- Chọn thương hiệu --</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Loại sản phẩm */}
          <div className="admin-form-group">
            <label>Loại sản phẩm</label>
            <select
              value={formData.order_type}
              onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
            >
              <option value="available">Có sẵn</option>
              <option value="pre_order">Pre-order (Chờ nhập hàng)</option>
            </select>
          </div>

          {/* Tồn kho */}
          <div className="admin-form-group">
            <label>Số lượng tồn kho</label>
            <input
              type="number"
              disabled={formData.order_type === "pre_order"}
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            />
            {formData.order_type === "pre_order" && <small style={{ color: "#94a3b8" }}>Pre-order không cần quản lý kho</small>}
          </div>

          {/* Ảnh sản phẩm */}
          <div className="admin-form-group full-width">
            <label>Ảnh đại diện (Thumbnail)</label>
            <div className="admin-image-upload" onClick={() => document.getElementById("fileInput").click()}>
              {formData.thumbnail_url ? (
                <img src={formData.thumbnail_url} alt="Preview" className="admin-preview-img" />
              ) : (
                <div style={{ padding: "20px" }}>
                  <span style={{ fontSize: "40px" }}>📸</span>
                  <p>{uploading ? "Đang upload..." : "Nhấn để chọn ảnh hoặc kéo thả"}</p>
                </div>
              )}
              <input
                id="fileInput"
                type="file"
                hidden
                accept="image/*"
                onChange={handleUpload}
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="admin-form-group full-width">
            <label>Mô tả sản phẩm</label>
            <textarea
              rows="5"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Thông tin chi tiết về sản phẩm..."
            ></textarea>
          </div>
        </div>

        <div className="admin-modal-actions" style={{ marginTop: "30px", justifyContent: "flex-end" }}>
          <Link href="/admin/products" className="admin-btn-page">Huỷ</Link>
          <button
            type="submit"
            className="admin-btn-add"
            disabled={loading || uploading}
          >
            {loading ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}
