"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const CartContext = createContext();

export function CartProvider({ children, initialSession }) {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache user + access token from onAuthStateChange
  // The singleton Supabase client (createClient from @supabase/ssr) uses
  // navigator.locks which deadlocks ALL requests during auth state changes.
  // We cache the token and use a separate client for data operations.
  const cachedUserRef = useRef(null);
  const cachedTokenRef = useRef(null);
  const cachedCartIdRef = useRef(null);
  const dataClientRef = useRef(null);
  const lastTokenRef = useRef(null);

  // Create/reuse a Supabase client with the cached access token
  // Uses a unique storageKey to avoid "multiple GoTrueClient" warnings
  // Only recreated when the token changes
  const getSupabaseWithToken = () => {
    const token = cachedTokenRef.current;
    if (!token) return null;

    // Reuse existing client if token hasn't changed
    if (dataClientRef.current && lastTokenRef.current === token) {
      return dataClientRef.current;
    }

    dataClientRef.current = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: "sb-cart-data",
        },
      }
    );
    lastTokenRef.current = token;
    return dataClientRef.current;
  };

  // 🧠 lấy cart_id của user
  const getCartId = async () => {
    // Return cached cart_id if available
    if (cachedCartIdRef.current) return cachedCartIdRef.current;

    const user = cachedUserRef.current;
    if (!user) {
      // Fallback: nếu ref chưa set (user click trước INITIAL_SESSION)
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          cachedUserRef.current = session.user;
          cachedTokenRef.current = session.access_token;
          console.log("🔍 [getCartId] Fallback getSession() → found user:", session.user.id);
        } else {
          console.log("🔍 [getCartId] Không có user (Guest)");
          return null;
        }
      } catch (e) {
        console.error("🔍 [getCartId] Fallback failed:", e);
        return null;
      }
    }

    const supabase = getSupabaseWithToken();
    if (!supabase) {
      console.log("🔍 [getCartId] No token available");
      return null;
    }

    const { data, error } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", cachedUserRef.current.id)
      .maybeSingle();

    if (data?.id) {
      cachedCartIdRef.current = data.id;
      return data.id;
    }

    // Nếu chưa có, tự động tạo mới cart cho user này
    const { data: newCart } = await supabase
      .from("carts")
      .insert({ user_id: cachedUserRef.current.id })
      .select("id")
      .single();

    if (newCart?.id) {
      cachedCartIdRef.current = newCart.id;
    }
    return newCart?.id;
  };

  // 🔥 hàm sync chung dùng RPC để tránh race condition
  const syncItem = async (productId, delta) => {
    console.log("🔥 SYNC ITEM", productId, delta);
    const cartId = await getCartId();
    console.log("🔥 CART ID", cartId);
    if (!cartId) return;

    const supabase = getSupabaseWithToken();
    if (!supabase) return;

    const { error } = await supabase.rpc("increment_cart_item", {
      p_cart_id: cartId,
      p_product_id: productId,
      p_delta: delta,
    });

    if (error) {
      console.error("❌ Sync to Database failed:", error.message, error.details);
    } else {
      console.log("✅ Sync to Database success");
    }
  };

  // 🛒 ADD
  const addToCart = async (product, qty = 1) => {
    let newQty = qty;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        newQty = existing.quantity + qty;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      }

      return [...prev, { ...product, quantity: qty }];
    });
    console.log("🔥 ADD CLICK", product.id, "QTY", qty);
    // 🔄 sync DB
    await syncItem(product.id, qty);
  };

  // ➕ tăng
  const increaseQty = async (id) => {
    console.log("🔥 INCREASE CLICK", id);
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );

    await syncItem(id, +1);
  };

  // ➖ giảm
  const decreaseQty = async (id) => {
    console.log("🔥 DECREASE CLICK", id);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );

    await syncItem(id, -1);
  };

  // 📦 load cart
  const loadCart = async () => {
    const cartId = await getCartId();

    if (!cartId) {
      // Nếu là khách, load từ localStorage
      const localCart = localStorage.getItem("guest_cart");
      if (localCart) {
        setCart(JSON.parse(localCart));
      }
      setIsInitialized(true);
      return;
    }

    console.log("📦 [loadCart] Loading from DB, cartId:", cartId);

    const supabase = getSupabaseWithToken();
    if (!supabase) {
      setIsInitialized(true);
      return;
    }

    const { data: items, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        figure_id,
        figures (*)
      `)
      .eq("cart_id", cartId);

    if (error) {
      console.error("❌ [loadCart] Query failed:", error);
      setIsInitialized(true);
      return;
    }

    console.log("📦 [loadCart] Raw items from DB:", items);

    // 🔥 flatten
    const formatted = (items || [])
      .filter(i => i.figures) // skip items with broken FK
      .map((item) => ({
        ...item.figures,
        quantity: item.quantity,
      }));

    console.log("📦 [loadCart] Formatted cart:", formatted.length, "items");
    setCart(formatted);
    setIsInitialized(true);
  };

  // 🤝 Merge guest cart to DB
  const mergeCart = async () => {
    const localCart = localStorage.getItem("guest_cart");
    if (!localCart) return;

    const items = JSON.parse(localCart);
    if (items.length === 0) return;

    console.log("🔄 Merging guest cart to database...", items.length, "items");

    // Đẩy từng món vào DB
    for (const item of items) {
      console.log("🔄 Merging item:", item.id, "QTY", item.quantity);
      await syncItem(item.id, item.quantity);
      console.log("✅ Merged item:", item.id);
    }

    // Xoá sau khi gộp xong
    localStorage.removeItem("guest_cart");
  };

  // ═══════════════════════════════════════════════════════════════
  // BOOT: Dùng initialSession từ server (truyền qua prop)
  // KHÔNG gọi getSession() từ singleton vì nó dùng navigator.locks
  // và bị deadlock. Server đã có session → truyền thẳng xuống.
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      console.log("🚀 [BOOT] CartContext mounting...");

      if (initialSession?.user) {
        console.log("🚀 [BOOT] User found:", initialSession.user.id);
        cachedUserRef.current = initialSession.user;
        cachedTokenRef.current = initialSession.access_token;

        if (cancelled) return;

        // Merge guest cart nếu có (từ trước khi login)
        await mergeCart();

        // Load cart từ DB
        await loadCart();
      } else {
        console.log("🚀 [BOOT] No session — guest mode");
        const localCart = localStorage.getItem("guest_cart");
        if (localCart) {
          try { setCart(JSON.parse(localCart)); } catch {}
        }
        setIsInitialized(true);
      }
    };

    boot();

    return () => { cancelled = true; };
  }, [initialSession]);

  // ═══════════════════════════════════════════════════════════════
  // AUTH LISTENER: Chỉ cần cho sign-out + token refresh
  // (Sign-in đã được xử lý bởi boot effect ở trên sau redirect)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔔 AUTH EVENT:", event);

        // Luôn sync refs
        cachedUserRef.current = session?.user ?? null;
        cachedTokenRef.current = session?.access_token ?? null;

        if (event === "SIGNED_OUT") {
          cachedCartIdRef.current = null;
          dataClientRef.current = null;
          lastTokenRef.current = null;
          setCart([]);
          localStorage.removeItem("guest_cart");
          setIsInitialized(true);
        }

        if (event === "TOKEN_REFRESHED") {
          // Force tạo lại data client với token mới
          dataClientRef.current = null;
          lastTokenRef.current = null;
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 💾 Save to localStorage for guest
  useEffect(() => {
    if (!isInitialized) return;
    // If no cached user, save to localStorage (guest mode)
    if (!cachedUserRef.current) {
      localStorage.setItem("guest_cart", JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const removeItems = async (ids) => {
    const cartId = await getCartId();
    if (!cartId || !ids.length) return;

    // 🔥 Chuyển tất cả ID sang Number để đảm bảo khớp kiểu dữ liệu BigInt trong DB
    const numericIds = ids.map(id => Number(id));

    // update UI trước (optimistic)
    setCart((prev) => prev.filter((item) => !numericIds.includes(Number(item.id))));

    // xoá trong DB
    const supabase = getSupabaseWithToken();
    if (!supabase) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId)
      .in("figure_id", numericIds);

    if (error) {
      console.error("Xóa thất bại:", error);
    }
  };

  const clearCart = () => {
    setCart([]);
  };


  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQty,
        decreaseQty,
        loadCart,
        removeItems,
        removeItem: (id) => removeItems([id]),
        clearCart
      }}

    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);