import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";

const CACHE_TTL = 300; // 5 phút

export async function GET(request, { params }) {
  const { id } = await params;
  const cacheKey = `product:${id}`;

  try {
    // 1. Kiểm tra cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return NextResponse.json(JSON.parse(cachedData));
    }

    console.log(`[CACHE MISS] ${cacheKey} - Fetching from DB...`);
    const supabase = await createClient();

    // 2. Lấy dữ liệu sản phẩm
    const { data: figureData, error: figureError } = await supabase
      .from("figures")
      .select("*, brands(name), categories(name)")
      .eq("id", id)
      .single();

    if (figureError) throw figureError;

    // 3. Lấy dữ liệu hình ảnh
    const { data: imagesData, error: imagesError } = await supabase
      .from("figure_images")
      .select("image_url")
      .eq("figure_id", id);

    if (imagesError) throw imagesError;

    const responseData = { product: figureData, images: imagesData };

    // 4. Lưu vào Redis
    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', CACHE_TTL);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
