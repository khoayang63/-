"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Server Action: Sign in with email/password
 */
export async function signIn(prevState, formData) {
  const supabase = await createClient();

  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server Action: Sign up with email/password
 */
export async function signUp(prevState, formData) {
  const supabase = await createClient();

  const name = formData.get("name")?.toString().trim();
  const username = formData.get("username")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!name || !username || !email || !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin." };
  }

  // Check if username already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    return { error: "Username đã tồn tại." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        username: username.toLowerCase().replace(/\s+/g, "_"),
        avatar_url: null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create cart for the new user
  if (data.user) {
    await supabase.from("carts").insert({
      user_id: data.user.id,
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server Action: Sign out
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
