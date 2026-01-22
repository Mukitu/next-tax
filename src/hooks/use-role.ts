import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";

export type AppRole = "citizen" | "officer" | "admin";

async function fetchRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as AppRole | undefined) ?? null;
}

export function useRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["role", user?.id ?? null],
    queryFn: () => fetchRole(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
}
