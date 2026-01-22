import { createClient } from "@supabase/supabase-js";

// Browser client for Lovable Cloud.
// NOTE: In this project the public key is provided as VITE_SUPABASE_PUBLISHABLE_KEY.
// We intentionally do NOT depend on VITE_SUPABASE_ANON_KEY to avoid URL/key mismatches.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
