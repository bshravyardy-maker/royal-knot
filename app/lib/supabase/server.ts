import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client initialized with the SERVICE ROLE key.
 * Used exclusively for server actions, route handlers, and server-side computations.
 * NEVER import this file into any client component ("use client").
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in server environment. Please check app/.env.local."
    );
  }

  if (!cachedAdmin) {
    cachedAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            cache: "no-store",
          });
        },
      },
    });
  }

  return cachedAdmin;
}
