"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children, initialUser, initialProfile }) {
  const [user, setUser] = useState(initialUser || null);
  const [profile, setProfile] = useState(initialProfile || null);

  // Sync auth state when Supabase fires events (e.g. after Server Action redirect)
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // After a sign-in, the page will be revalidated by the Server Action,
        // so the server-provided initialUser/initialProfile will update.
        // We only update here as a fallback for client-side auth events.
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, username, role")
            .eq("id", currentUser.id)
            .single();
          setProfile(profileData);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Keep in sync when server re-renders with new props
  useEffect(() => {
    setUser(initialUser || null);
    setProfile(initialProfile || null);
  }, [initialUser, initialProfile]);

  const isAdmin = profile?.role === "admin";

  // Refresh profile from client-side (used by profile edit page)
  const refreshProfile = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, username, role")
      .eq("id", user.id)
      .single();
    setProfile(profileData);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading: false, refreshProfile, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
