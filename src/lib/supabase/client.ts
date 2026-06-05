import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabase } from "@/lib/env";

export function createBrowserSupabase() {
  if (!hasSupabase()) return null;
  return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}
