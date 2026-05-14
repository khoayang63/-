"use client";

import "./admin.css";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/admin", label: "📊 Tổng quan", exact: true },
  { href: "/admin/orders", label: "📦 Đơn hàng" },
  { href: "/admin/products", label: "🏷️ Sản phẩm" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  // Middleware guarantees only admins reach here.
  // This is a defensive fallback only.
  if (!isAdmin) return null;

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>🛠️ Admin</h2>
          <p>TK Shop</p>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item">
            ← Về trang chủ
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
