// Server-only Supabase client using the SERVICE ROLE key.
// Never import this file from anything that ships to the browser.
import { createClient } from "@supabase/supabase-js";

// Falls back to VITE_SUPABASE_URL: the project URL isn't secret (it's
// already shipped to the browser via the Vite env var), so it's safe
// to reuse here. This was the actual bug — only VITE_SUPABASE_URL was
// set in Vercel, so process.env.SUPABASE_URL was undefined and
// createClient() below silently produced a client that could never
// reach Supabase. Every /api/ai/* call and /api/delete-account
// was failing as a result — which is why the AI wasn't replying.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing Supabase server config — set SUPABASE_SERVICE_ROLE_KEY (and either SUPABASE_URL or VITE_SUPABASE_URL) in Vercel's Environment Variables."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
