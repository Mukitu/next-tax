import { createClient } from "@supabase/supabase-js";

// External Supabase connection (public values are safe to ship to the browser).
// NOTE: Never store the service_role key in the frontend.
// Prefer Vercel/hosting env vars (Vite requires VITE_ prefix). Fallback keeps local preview working.
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://zorbrvmnlyhiuurmjyvu.supabase.co";
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcmJydm1ubHloaXV1cm1qeXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDc5OTUsImV4cCI6MjA4NDYyMzk5NX0.1S9KDv85lawiHQ6VHhYY5fRlLsJCiPNzQGz38iSDdmo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
