import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // 1. Đăng xuất khỏi Supabase (Server-side)
  await supabase.auth.signOut();

  // 2. Tìm và xoá tất cả các cookie liên quan đến auth-token
  const allCookies = cookieStore.getAll();
  const response = NextResponse.json({ success: true });

  allCookies.forEach(cookie => {
    if (cookie.name.includes("auth-token")) {
      response.cookies.set(cookie.name, "", {
        maxAge: -1,
        path: "/",
      });
    }
  });

  return response;
}
