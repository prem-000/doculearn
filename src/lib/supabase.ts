import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your environment variables.");
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as ReturnType<typeof createClient>;

// For server-side operations that bypass RLS (use with caution)
export const supabaseAdmin = (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null as unknown as ReturnType<typeof createClient>;

export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    return createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseAdmin;
};
