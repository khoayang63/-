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

// ✏️ PATCH — Cập nhật sản phẩm
export async function PATCH(request, { params }) {
  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;
  const { id } = await params;
  const body = await request.json();

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.price !== undefined) updates.price = parseInt(body.price);
  if (body.stock_quantity !== undefined) updates.stock_quantity = parseInt(body.stock_quantity);
  if (body.order_type !== undefined) updates.order_type = body.order_type;
  if (body.brand_id !== undefined) updates.brand_id = body.brand_id ? parseInt(body.brand_id) : null;
  if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;
  if (body.description !== undefined) updates.description = body.description;

  const { data: figure, error } = await supabase
    .from("figures")
    .update(updates)
    .eq("id", id)
    .select("*, brands(name)")
    .single();

  if (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    return Response.json({ error: "Lỗi cập nhật sản phẩm" }, { status: 500 });
  }

  return Response.json({ figure });
}

// ❌ DELETE — Xoá sản phẩm (hard delete)
export async function DELETE(request, { params }) {
  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;
  const { id } = await params;

  // Xoá ảnh liên quan trong storage trước
  const { data: images } = await supabase
    .from("figure_images")
    .select("image_url")
    .eq("figure_id", id);

  if (images && images.length > 0) {
    // Trích xuất path từ URL để xoá trong storage
    const paths = images
      .map((img) => {
        try {
          const url = new URL(img.image_url);
          const match = url.pathname.match(/\/storage\/v1\/object\/public\/figure_images\/(.+)/);
          return match ? match[1] : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from("figure_images").remove(paths);
    }
  }

  // figure_images sẽ tự xoá nhờ ON DELETE CASCADE
  const { error } = await supabase
    .from("figures")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Lỗi xoá sản phẩm:", error);
    return Response.json({ error: "Lỗi xoá sản phẩm" }, { status: 500 });
  }

  return Response.json({ success: true });
}

// 📥 GET — Lấy chi tiết 1 sản phẩm (cho form edit)
export async function GET(request, { params }) {
  const result = await getAdminSupabase();
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { supabase } = result;
  const { id } = await params;

  const { data: figure, error } = await supabase
    .from("figures")
    .select("*, brands(name), figure_images(id, image_url, display_order)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    return Response.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
  }

  return Response.json({ figure });
}
