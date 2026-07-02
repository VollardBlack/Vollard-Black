import { createClient } from '@supabase/supabase-js';

// SERVER ONLY. This uses the service role key, which bypasses RLS.
// Only import this file from API routes (src/app/api/**/route.js) or
// other server-side code — never from a 'use client' component, or the
// key will end up in the browser bundle.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    'Supabase admin env vars are missing. Set SUPABASE_SERVICE_ROLE_KEY in .env.local (server-only, no NEXT_PUBLIC_ prefix).'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
