import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anon = process.env.SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE; // optional

// Pass-through client: uses the user's JWT so RLS applies naturally.
export const createUserClient = (jwt?: string) =>
  createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} },
  });

// Admin client (bypass RLS) – only use for controlled tasks after verifying the user.
export const createAdminClient = () => {
  if (!service) throw new Error("Service role not configured");
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
};
