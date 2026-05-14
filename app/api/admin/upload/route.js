import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request) {
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

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return Response.json({ error: "File là bắt buộc" }, { status: 400 });
  }

  // Tạo tên file unique
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `products/${fileName}`;

  // Upload lên Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("figure_images")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return Response.json({ error: "Lỗi upload ảnh" }, { status: 500 });
  }

  // Lấy public URL
  const { data: urlData } = supabase.storage
    .from("figure_images")
    .getPublicUrl(filePath);

  return Response.json({ url: urlData.publicUrl });
}
