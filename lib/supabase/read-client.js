"use client";

import { createClient } from "@supabase/supabase-js";
import { createClient as createSingletonClient } from "@/lib/supabase/client";

// Module-level cache: one client per storageKey, never recreated
const clientCache = {};

/**
 * Returns a lock-free Supabase client for read-only data operations.
 * Bypasses the singleton from @supabase/ssr (which uses navigator.locks
 * and deadlocks all requests during auth state changes).
 *
 * Each unique `key` gets its own cached client — no duplicate warnings.
 */
export function getReadClient(key = "sb-read-default") {
  if (clientCache[key]) return clientCache[key];

  clientCache[key] = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: key,
      },
    }
  );

  return clientCache[key];
}

/**
 * Returns a lock-free Supabase client WITH the current user's auth token.
 * Use this for authenticated write operations (profile update, storage upload, etc.).
 *
 * This is async because it must read the session from the singleton first.
 * The returned client bypasses navigator.locks while honoring RLS policies.
 */
export async function getAuthClient() {
  const singleton = createSingletonClient();
  const { data: { session } } = await singleton.auth.getSession();

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "sb-auth-write",
      },
      global: {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
      },
    }
  );

  return client;
}
