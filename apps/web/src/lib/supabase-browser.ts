import { type SupabaseClient, createClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  client = createClient(url, anonKey);
  return client;
};
