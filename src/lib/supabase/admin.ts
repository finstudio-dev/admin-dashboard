import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// A privileged client that uses the SERVICE ROLE key and bypasses Row Level
// Security entirely. Only import this inside server actions ("use server"
// files) — never in a client component, and never prefix the underlying
// env var with NEXT_PUBLIC_ or it will be shipped to every visitor's browser.
//
// Every function that uses this client MUST manually verify the caller is
// an admin first (see deleteMember in actions.ts for the pattern), since
// the usual RLS-based protection does not apply here.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it as a server-side environment variable (not NEXT_PUBLIC_) to enable admin-only actions like deleting a member."
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
