import { createClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "@/lib/env";

export function createServerSupabase() {
  if (!hasSupabase()) return null;

  const key = env.supabase.serviceRoleKey || env.supabase.anonKey;
  return createClient(env.supabase.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
