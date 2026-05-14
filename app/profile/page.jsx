"use client";

import { useState, useEffect, useRef } from "react";
import { getAuthClient } from "@/lib/supabase/read-client";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // 🔥 sync từ AuthContext → local state
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setPreviewUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // Middleware protects /profile — no client-side redirect needed

  const [selectedFile, setSelectedFile] = useState(null);

  // 📸 Chỉ xử lý preview khi chọn ảnh
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh tối đa 2MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // 💾 Lưu tổng hợp (Ảnh + Tên)
  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    setSaving(true);

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Nếu có chọn file mới -> Upload trước
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const supabase = await getAuthClient();
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) throw new Error("Không thể tải ảnh lên: " + uploadError.message);

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
          finalAvatarUrl = urlData.publicUrl;
      }

      // 2. Cập nhật Database (Tên + Ảnh)
      const supabaseUpdate = await getAuthClient();
      const { error: updateError } = await supabaseUpdate
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          avatar_url: finalAvatarUrl
        })
        .eq("id", user.id);

      if (updateError) throw new Error("Cập nhật thông tin thất bại");

      setAvatarUrl(finalAvatarUrl);
      setSelectedFile(null);
      await refreshProfile();
      toast.success("Cập nhật hồ sơ thành công! 🎉");
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra khi lưu");
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* 🎨 HEADER */}
        <div className="profile-card-header">
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin tài khoản</p>
        </div>

        {/* 📸 AVATAR SECTION */}
        <div className="profile-avatar-section">
          <div
            className="profile-avatar-wrapper"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar"
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                <span>{fullName?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
            )}

            {/* overlay */}
            <div className="profile-avatar-overlay">
              <span>{uploading ? "⏳" : "📷"}</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            style={{ display: "none" }}
          />

          <p className="profile-avatar-hint">
            Nhấn vào avatar để thay đổi ảnh (tối đa 2MB)
          </p>
        </div>

        {/* 📝 FORM */}
        <div className="profile-form">

          {/* Email (readonly) */}
          <div className="profile-field">
            <label>Email</label>
            <input
              type="email"
              value={user.email || ""}
              readOnly
              className="profile-input profile-input-disabled"
            />
          </div>

          {/* Username (readonly) */}
          {profile?.username && (
            <div className="profile-field">
              <label>Username</label>
              <input
                type="text"
                value={profile.username}
                readOnly
                className="profile-input profile-input-disabled"
              />
            </div>
          )}

          {/* Full name (editable) */}
          <div className="profile-field">
            <label>Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className="profile-input"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="profile-save-btn"
          >
            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </button>
        </div>

      </div>
    </div>
  );
}
