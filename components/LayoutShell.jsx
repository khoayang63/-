"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionModal from "@/components/SessionModal";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Admin có layout riêng → không cần Header/Footer
  if (isAdmin) {
    return (
      <>
        {children}
        <SessionModal />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      <SessionModal />
    </div>
  );
}
