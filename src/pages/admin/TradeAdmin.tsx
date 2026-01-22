import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/browserClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

type CountryRow = { id: string; name: string; code: string; import_tax_rate: number; export_tax_rate: number };
type CategoryRow = { id: string; name: string; base_tax_rate: number };
type FxRow = { code: string; rate: number };

const countrySchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(10),
  import_tax_rate: z.coerce.number().min(0).max(100),
  export_tax_rate: z.coerce.number().min(0).max(100),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  base_tax_rate: z.coerce.number().min(0).max(100),
});

async function fetchCountries(): Promise<CountryRow[]> {
  const { data, error } = await supabase.from("countries").select("id, name, code, import_tax_rate, export_tax_rate").order("name");
  if (error) throw error;
  return (data ?? []) as CountryRow[];
}

async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from("product_categories").select("id, name, base_tax_rate").order("name");
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
}

async function fetchUsdBdt(): Promise<FxRow | null> {
  const { data, error } = await supabase.from("exchange_rates").select("code, rate").eq("code", "USD_BDT").maybeSingle();
  if (error) throw error;
  return (data as FxRow | null) ?? null;
}

export default function TradeAdminPage() {
  const qc = useQueryClient();

  const countriesQ = useQuery({ queryKey: ["countries"], queryFn: fetchCountries });
  const categoriesQ = useQuery({ queryKey: ["product_categories"], queryFn: fetchCategories });
  const fxQ = useQuery({ queryKey: ["exchange_rate", "USD_BDT"], queryFn: fetchUsdBdt, staleTime: 60_000 });

  const [countryForm, setCountryForm] = useState({ name: "", code: "", import_tax_rate: "0", export_tax_rate: "0" });
  const [categoryForm, setCategoryForm] = useState({ name: "", base_tax_rate: "0" });
  const [usdBdt, setUsdBdt] = useState("120");

  const fxValue = fxQ.data?.rate;
  useMemo(() => {
    if (typeof fxValue === "number") setUsdBdt(String(fxValue));
    return null;
  }, [fxValue]);

  const createCountry = useMutation({
    mutationFn: async () => {
      const parsed = countrySchema.safeParse(countryForm);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid");
      const { error } = await supabase.from("countries").insert({
        ...parsed.data,
        import_tax_rate: parsed.data.import_tax_rate,
        export_tax_rate: parsed.data.export_tax_rate,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Country added");
      setCountryForm({ name: "", code: "", import_tax_rate: "0", export_tax_rate: "0" });
      await qc.invalidateQueries({ queryKey: ["countries"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Create failed"),
  });

  const deleteCountry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("countries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["countries"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const createCategory = useMutation({
    mutationFn: async () => {
      const parsed = categorySchema.safeParse(categoryForm);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid");
      const { error } = await supabase.from("product_categories").insert(parsed.data);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Category added");
      setCategoryForm({ name: "", base_tax_rate: "0" });
      await qc.invalidateQueries({ queryKey: ["product_categories"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Create failed"),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: ["product_categories"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const upsertFx = useMutation({
    mutationFn: async () => {
      const rate = Number(usdBdt);
      if (!Number.isFinite(rate) || rate <= 0 || rate > 1000) throw new Error("Invalid rate");
      const { error } = await supabase.from("exchange_rates").upsert({ code: "USD_BDT", rate }, { onConflict: "code" });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Updated");
      await qc.invalidateQueries({ queryKey: ["exchange_rate", "USD_BDT"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const countries = countriesQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  return (
    <AppShell>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Import/Export Management</h1>
          <p className="mt-2 text-muted-foreground">Manage countries, product categories, and USD→BDT rate.</p>
        </div>

        <Tabs defaultValue="fx" className="grid gap-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="fx">Exchange rate</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="fx" className="m-0">
            <Card className="shadow-[var(--shadow-elev)]">
              <CardHeader>
                <CardTitle>USD → BDT</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:max-w-md">
                <div className="grid gap-2">
                  <Label>Rate</Label>
                  <Input inputMode="decimal" value={usdBdt} onChange={(e) => setUsdBdt(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Citizen trade calculator uses this when currency = USD.</p>
                </div>
                <Button onClick={() => upsertFx.mutate()} disabled={upsertFx.isPending}>
                  {upsertFx.isPending ? "Saving..." : "Save rate"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries" className="m-0 grid gap-6">
            <Card className="shadow-[var(--shadow-elev)]">
              <CardHeader>
                <CardTitle>Add country</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={countryForm.name} onChange={(e) => setCountryForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Code</Label>
                  <Input value={countryForm.code} onChange={(e) => setCountryForm((p) => ({ ...p, code: e.target.value }))} placeholder="US" />
                </div>
                <div className="grid gap-2">
                  <Label>Import rate (%)</Label>
                  <Input inputMode="decimal" value={countryForm.import_tax_rate} onChange={(e) => setCountryForm((p) => ({ ...p, import_tax_rate: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Export rate (%)</Label>
                  <Input inputMode="decimal" value={countryForm.export_tax_rate} onChange={(e) => setCountryForm((p) => ({ ...p, export_tax_rate: e.target.value }))} />
                </div>
                <div className="md:col-span-4">
                  <Button onClick={() => createCountry.mutate()} disabled={createCountry.isPending}>
                    {createCountry.isPending ? "Saving..." : "Add country"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-elev)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Countries</CardTitle>
                <div className="text-sm text-muted-foreground">{countriesQ.isLoading ? "Loading..." : `${countries.length} rows`}</div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Import</TableHead>
                        <TableHead className="text-right">Export</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                            No countries.
                          </TableCell>
                        </TableRow>
                      ) : (
                        countries.slice(0, 50).map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell className="font-mono text-xs">{c.code}</TableCell>
                            <TableCell className="text-right">{Number(c.import_tax_rate).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{Number(c.export_tax_rate).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => deleteCountry.mutate(c.id)} disabled={deleteCountry.isPending}>
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
          </TabsContent>

          <TabsContent value="categories" className="m-0 grid gap-6">
            <Card className="shadow-[var(--shadow-elev)]">
              <CardHeader>
                <CardTitle>Add category</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2 md:col-span-2">
                  <Label>Name</Label>
                  <Input value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Base rate (%)</Label>
                  <Input inputMode="decimal" value={categoryForm.base_tax_rate} onChange={(e) => setCategoryForm((p) => ({ ...p, base_tax_rate: e.target.value }))} />
                </div>
                <div className="md:col-span-3">
                  <Button onClick={() => createCategory.mutate()} disabled={createCategory.isPending}>
                    {createCategory.isPending ? "Saving..." : "Add category"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-elev)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categories</CardTitle>
                <div className="text-sm text-muted-foreground">{categoriesQ.isLoading ? "Loading..." : `${categories.length} rows`}</div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                            No categories.
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.slice(0, 50).map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell className="text-right">{Number(c.base_tax_rate).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => deleteCategory.mutate(c.id)} disabled={deleteCategory.isPending}>
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
          </TabsContent>
        </Tabs>

        <Separator className="mt-8" />
      </div>
    </AppShell>
  );
}
