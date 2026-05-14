import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Montserrat } from "next/font/google";
import "./globals.css";

import { CartProvider } from "@/context/CartContext.jsx";
import { AuthProvider } from "@/context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import LayoutShell from "@/components/LayoutShell";
import ChatBox from "@/components/chatbox";
import { createClient } from "@/lib/supabase/server";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "M Figure Store",
  description: "Anime Figure Shop",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side: fetch user and profile so AuthProvider is pre-populated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Also get the session (for the access_token) so CartProvider can
  // load the cart without calling the singleton's getSession() client-side
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, username, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${montserrat.variable}`}
    >
      <body>

        <AuthProvider initialUser={user} initialProfile={profile}>
          <CartProvider initialSession={session}>
            <LayoutShell>{children}</LayoutShell>

            <Toaster position="top-right" />
            <ChatBox />
          </CartProvider>
        </AuthProvider>

      </body>
    </html>
  );
}