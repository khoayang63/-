import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    console.log("🚀 START CHECKOUT");

    const body = await req.json();
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // 🔐 Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = body.items;

    if (!items || items.length === 0) {
      return Response.json({ error: "No items" }, { status: 400 });
    }

    // 🧠 Map quantity
    const qtyMap = new Map(items.map((i) => [i.id, i.quantity]));
    const ids = items.map((i) => i.id);

    // 📦 Fetch DB
    const { data: figures, error } = await supabase
      .from("figures")
      .select("id, price, order_type, stock_quantity")
      .in("id", ids);

    if (error || !figures) {
      return Response.json({ error: "Fetch failed" }, { status: 500 });
    }

    // 💰 Calculate
    let totalAmount = 0;

    for (const fig of figures) {
      const qty = qtyMap.get(fig.id);


      if (fig.order_type === "available" && fig.stock_quantity < qty) {
        return Response.json({ error: "Out of stock" }, { status: 400 });
      }

      totalAmount += fig.price * qty;
    }


    // 🧹 xoá session cũ của user
    const { error: deleteError } = await supabase
      .from("checkout_sessions")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.log("❌ DELETE SESSION ERROR:", deleteError);
      return Response.json({ error: "Delete session failed" }, { status: 500 });
    }

    // 🆕 🔥 TẠO SESSION
    const sessionId = uuidv4();

    const { error: sessionError } = await supabase
      .from("checkout_sessions")
      .insert({
        id: sessionId,
        user_id: user.id,
        items: items,
        total_amount: totalAmount,
      });

    if (sessionError) {
      console.log("❌ SESSION ERROR:", sessionError);
      return Response.json({ error: "Create session failed" }, { status: 500 });
    }

    console.log("✅ SESSION CREATED:", sessionId);

    // 🎯 RETURN SESSION
    return Response.json({
      sessionId,
    });

  } catch (err) {
    console.error("💥 CRASH:", err);
    return Response.json({ error: "Server crashed" }, { status: 500 });
  }
}