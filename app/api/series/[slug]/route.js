import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";

const CACHE_TTL = 300; // 5 phút

export async function GET(request, { params }) {
  const { slug } = await params;
  const cacheKey = `series:${slug}`;

  try {
    // 1. Kiểm tra cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return NextResponse.json(JSON.parse(cachedData));
    }

    console.log(`[CACHE MISS] ${cacheKey} - Fetching from DB...`);
    const supabase = await createClient();

    const { data: seriesData, error: seriesError } = await supabase
      .from("series")
      .select("*")
      .eq("slug", slug)
      .single();

    if (seriesError) throw seriesError;

    const { data: figuresData, error: figuresError } = await supabase
      .from("figures")
      .select("*, brands(name)")
      .eq("series_id", seriesData.id);

    if (figuresError) throw figuresError;

    const responseData = { seriesInfo: seriesData, figures: figuresData };

    // 3. Lưu vào Redis Cache
    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', CACHE_TTL);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
