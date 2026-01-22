import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useFiscalYears, useTaxSlabs, type TaxSlabRow } from "@/hooks/use-tax-slabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

const slabSchema = z.object({
  fiscal_year: z.string().trim().min(4).max(20),
  slab_from: z.coerce.number().min(0).max(1_000_000_000),
  slab_to: z.union([z.coerce.number().min(0).max(1_000_000_000), z.literal("")]).transform((v) => (v === "" ? null : v)),
  rate: z.coerce.number().min(0).max(1),
});

export default function TaxSlabsAdminPage() {
  const qc = useQueryClient();
  const yearsQuery = useFiscalYears();
  const [year, setYear] = useState<string>("");
  const slabsQuery = useTaxSlabs(year || null);

  useEffect(() => {
    if (!year && (yearsQuery.data?.length ?? 0) > 0) setYear(yearsQuery.data![0]);
  }, [year, yearsQuery.data]);

  const [slabFrom, setSlabFrom] = useState<string>("0");
  const [slabTo, setSlabTo] = useState<string>("");
  const [rate, setRate] = useState<string>("0");

  const createMut = useMutation({
    mutationFn: async () => {
      const parsed = slabSchema.safeParse({ fiscal_year: year, slab_from: slabFrom, slab_to: slabTo, rate });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid values");
      const { error } = await supabase.from("tax_slabs").insert(parsed.data);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Slab added");
      setSlabFrom("0");
      setSlabTo("");
      setRate("0");
      await qc.invalidateQueries({ queryKey: ["tax_slabs", year] });
      await qc.invalidateQueries({ queryKey: ["tax_fiscal_years"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Create failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tax_slabs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["tax_slabs", year] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const slabs = slabsQuery.data ?? [];
  const yearList = yearsQuery.data ?? [];
  const uniqueYears = useMemo(() => yearList, [yearList]);

  return (
    <AppShell>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Tax Rules (Slabs)</h1>
          <p className="mt-2 text-muted-foreground">Configure progressive slabs per fiscal year.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-[var(--shadow-elev)]">
            <CardHeader>
              <CardTitle>Fiscal year</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Active year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2026-2027" />
                <p className="text-xs text-muted-foreground">Type a new year to start configuring it.</p>
              </div>
              {uniqueYears.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {uniqueYears.slice(0, 8).map((y) => (
                    <Button key={y} type="button" size="sm" variant={y === year ? "default" : "outline"} onClick={() => setYear(y)}>
                      {y}
                    </Button>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elev)]">
            <CardHeader>
              <CardTitle>Add slab</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>From (BDT)</Label>
                <Input inputMode="decimal" value={slabFrom} onChange={(e) => setSlabFrom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>To (BDT) — optional</Label>
                <Input inputMode="decimal" value={slabTo} onChange={(e) => setSlabTo(e.target.value)} placeholder="Leave blank for Above" />
              </div>
              <div className="grid gap-2">
                <Label>Rate (decimal)</Label>
                <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.10 for 10%" />
              </div>
              <Button onClick={() => createMut.mutate()} disabled={!year || createMut.isPending}>
                {createMut.isPending ? "Saving..." : "Add slab"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Slabs — {year || "(no year)"}</CardTitle>
            <div className="text-sm text-muted-foreground">{slabsQuery.isLoading ? "Loading..." : `${slabs.length} rows`}</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slabs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No slabs yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    slabs.map((s: TaxSlabRow) => (
                      <TableRow key={s.id}>
                        <TableCell>{Number(s.slab_from).toLocaleString("en-BD")}</TableCell>
                        <TableCell>{s.slab_to == null ? "Above" : Number(s.slab_to).toLocaleString("en-BD")}</TableCell>
                        <TableCell className="text-right">{(Number(s.rate) * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => deleteMut.mutate(s.id)} disabled={deleteMut.isPending}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
