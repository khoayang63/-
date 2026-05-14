import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// 📥 GET — Lấy danh sách sản phẩm (có phân trang, search, filter)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || ""; // available | pre_order
  const stock = searchParams.get("stock") || ""; // in_stock | out_of_stock
  const sort = searchParams.get("sort") || "newest"; // newest | price_asc | price_desc

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;

  // Join bảng brands qua brand_id
  let query = supabase
    .from("figures")
    .select("*, brands(name)", { count: "exact" });

  // Search
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Filter theo loại
  if (type === "available" || type === "pre_order") {
    query = query.eq("order_type", type);
  }

  // Filter theo tồn kho
  if (stock === "in_stock") {
    query = query.gt("stock_quantity", 0);
  } else if (stock === "out_of_stock") {
    query = query.lte("stock_quantity", 0);
  }

  // Sort
  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Pagination
  query = query.range(from, to);

  const { data: figures, error, count } = await query;

  if (error) {
    console.error("Lỗi lấy sản phẩm:", error);
    return Response.json({ error: "Lỗi lấy danh sách sản phẩm" }, { status: 500 });
  }

  return Response.json({
    figures,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
}

// ➕ POST — Tạo sản phẩm mới
export async function POST(request) {
  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;
  const body = await request.json();

  const { name, price, stock_quantity, order_type, brand_id, thumbnail_url, description, images } = body;

  // Validate
  if (!name || !price) {
    return Response.json({ error: "Tên và giá là bắt buộc" }, { status: 400 });
  }

  // Insert sản phẩm
  const { data: figure, error } = await supabase
    .from("figures")
    .insert({
      name,
      price: parseInt(price),
      stock_quantity: parseInt(stock_quantity || 0),
      order_type: order_type || "available",
      brand_id: brand_id ? parseInt(brand_id) : null,
      thumbnail_url: thumbnail_url || null,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Lỗi tạo sản phẩm:", error);
    return Response.json({ error: "Lỗi tạo sản phẩm" }, { status: 500 });
  }

  // Insert ảnh phụ vào figure_images (nếu có)
  if (images && images.length > 0) {
    const imageRows = images.map((url, index) => ({
      figure_id: figure.id,
      image_url: url,
      display_order: index,
    }));

    await supabase.from("figure_images").insert(imageRows);
  }

  return Response.json({ figure }, { status: 201 });
}
