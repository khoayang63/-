import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req, { params }) {
    const { sessionId } = await params;

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

    // 🔥 lấy cả expires_at
    const { data, error } = await supabase
        .from("checkout_sessions")
        .select("items, expires_at")
        .eq("id", sessionId)
        .single();

    if (error || !data) {
        return Response.json({ error: "Session not found" }, { status: 404 });
    }

    // 🔥 CHECK EXPIRE
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    console.log(now)
    console.log(expiresAt)
    if (expiresAt < now) {
        // (optional) xoá luôn session hết hạn
        await supabase
            .from("checkout_sessions")
            .delete()
            .eq("id", sessionId);

        return Response.json(
            { error: "Session expired" },
            { status: 400 }
        );
    }

    // ✅ OK
    return Response.json({
        items: data.items,
    });
}