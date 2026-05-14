import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";

const CACHE_TTL = 300; // 5 phút

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const sort = searchParams.get("sort") || "latest";

  const cacheKey = `products:limit=${limit || 'all'}:sort=${sort}`;

  try {
    // 1. Kiểm tra cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return NextResponse.json({ products: JSON.parse(cachedData) });
    }

    console.log(`[CACHE MISS] ${cacheKey} - Fetching from DB...`);
    
    // 2. Nếu miss, truy vấn DB
    const supabase = await createClient();

    let query = supabase
      .from("figures")
      .select("*, brands(name)");

    if (sort === "latest") {
      query = query.order("created_at", { ascending: false });
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // 3. Lưu vào Redis Cache
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL);

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
