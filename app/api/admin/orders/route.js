import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper: tạo Supabase client + check admin
async function getAdminSupabase() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };

  return { supabase, user };
}

export async function GET() {
  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:user_id ( full_name, username ),
      order_items ( id, quantity, price_at_purchase, figure_id, figures ( name ) )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error); // 🔥 thêm dòng này
    return Response.json({ error: "Lỗi lấy danh sách đơn hàng" }, { status: 500 });
  }

  return Response.json({ orders });
}
