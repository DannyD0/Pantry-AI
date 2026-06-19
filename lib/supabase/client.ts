import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// Cast bypasses a type-mapping mismatch introduced in supabase-js v2 where
// createBrowserClient<Database> passes Database["public"] to SupabaseClient's
// SchemaName slot (expects a string), causing Schema to resolve as `never`.
// SupabaseClient<Database> with a single type arg resolves Schema correctly.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<Database>
}
