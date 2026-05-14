"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function EditProductPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    brand_id: "",
    order_type: "available",
    stock_quantity: "0",
    description: "",
    thumbnail_url: "",
  });

  // Lấy dữ liệu sản phẩm và brands
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProd, resBrands] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch("/api/admin/brands")
        ]);

        const dataProd = await resProd.json();
        const dataBrands = await resBrands.json();

        if (resProd.ok) {
          setFormData({
            name: dataProd.figure.name,
            price: dataProd.figure.price,
            brand_id: dataProd.figure.brand_id || "",
            order_type: dataProd.figure.order_type,
            stock_quantity: dataProd.figure.stock_quantity.toString(),
            description: dataProd.figure.description || "",
            thumbnail_url: dataProd.figure.thumbnail_url || "",
          });
        }
        setBrands(dataBrands.brands || []);
      } catch (error) {
        toast.error("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
        toast.success("Upload ảnh mới thành công");
      }
    } catch (error) {
      toast.error("Lỗi upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Đã cập nhật sản phẩm!");
        router.push("/admin/products");
      } else {
        const err = await res.json();
        toast.error(err.error || "Lỗi khi cập nhật");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page-loading">Đang tải dữ liệu sản phẩm...</div>;

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <Link href="/admin/products" style={{ textDecoration: "none", color: "inherit" }}>🏷️ Sản phẩm</Link> 
          <span style={{ margin: "0 10px", color: "#94a3b8" }}>/</span>
          Chỉnh sửa
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card">
        <div className="admin-form-grid">
          <div className="admin-form-group full-width">
            <label>Tên sản phẩm *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="admin-form-group">
            <label>Giá (VNĐ) *</label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

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

          <div className="admin-form-group">
            <label>Số lượng tồn kho</label>
            <input
              type="number"
              disabled={formData.order_type === "pre_order"}
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            />
          </div>

          <div className="admin-form-group full-width">
            <label>Ảnh đại diện (Thumbnail)</label>
            <div className="admin-image-upload" onClick={() => document.getElementById("fileInputEdit").click()}>
              {formData.thumbnail_url ? (
                <img src={formData.thumbnail_url} alt="Preview" className="admin-preview-img" />
              ) : (
                <div style={{ padding: "20px" }}>
                  <span style={{ fontSize: "40px" }}>📸</span>
                  <p>Chưa có ảnh. Nhấn để upload.</p>
                </div>
              )}
              <input
                id="fileInputEdit"
                type="file"
                hidden
                accept="image/*"
                onChange={handleUpload}
              />
            </div>
          </div>

          <div className="admin-form-group full-width">
            <label>Mô tả sản phẩm</label>
            <textarea
              rows="5"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
        </div>

        <div className="admin-modal-actions" style={{ marginTop: "30px", justifyContent: "flex-end" }}>
          <Link href="/admin/products" className="admin-btn-page">Huỷ</Link>
          <button
            type="submit"
            className="admin-btn-add"
            style={{ background: "#3b82f6" }}
            disabled={saving || uploading}
          >
            {saving ? "Đang lưu..." : "Cập nhật thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
