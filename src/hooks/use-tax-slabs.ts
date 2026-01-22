import { supabase } from "@/integrations/supabase/browserClient";
import { useQuery } from "@tanstack/react-query";

export type TaxSlabRow = {
  id: string;
  fiscal_year: string;
  slab_from: number;
  slab_to: number | null;
  rate: number; // decimal (e.g. 0.1 for 10%)
  created_at: string;
};

export async function fetchFiscalYears(): Promise<string[]> {
  const { data, error } = await supabase.from("tax_slabs").select("fiscal_year");
  if (error) throw error;
  const years = Array.from(new Set((data ?? []).map((r: any) => String(r.fiscal_year)))).sort().reverse();
  return years;
}

export async function fetchTaxSlabs(fiscalYear: string): Promise<TaxSlabRow[]> {
  const { data, error } = await supabase
    .from("tax_slabs")
    .select("id, fiscal_year, slab_from, slab_to, rate, created_at")
    .eq("fiscal_year", fiscalYear)
    .order("slab_from", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TaxSlabRow[];
}

export function useFiscalYears() {
  return useQuery({
    queryKey: ["tax_fiscal_years"],
    queryFn: fetchFiscalYears,
    staleTime: 60_000,
  });
}

export function useTaxSlabs(fiscalYear: string | null) {
  return useQuery({
    queryKey: ["tax_slabs", fiscalYear ?? null],
    queryFn: () => fetchTaxSlabs(fiscalYear!),
    enabled: Boolean(fiscalYear),
    staleTime: 60_000,
  });
}
