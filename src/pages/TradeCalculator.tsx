import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { calculateTradeTax, type TradeType } from "@/lib/trade/calc";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

type Country = { id: string; name: string; code: string; import_tax_rate: number; export_tax_rate: number };
type Category = { id: string; name: string; base_tax_rate: number };

type FxRow = { code: string; rate: number };

const formSchema = z.object({
  productName: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive().max(1_000_000_000),
});

function formatBDT(n: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
}

async function fetchCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from("countries")
    .select("id, name, code, import_tax_rate, export_tax_rate")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Country[];
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name, base_tax_rate")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

async function fetchUsdBdt(): Promise<number> {
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("code, rate")
    .eq("code", "USD_BDT")
    .maybeSingle();
  if (error) throw error;
  const row = data as FxRow | null;
  return Number(row?.rate ?? 120);
}

export default function TradeCalculatorPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<TradeType>("import");
  const [countryId, setCountryId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const [amountInput, setAmountInput] = useState<string>("0");

  const countriesQuery = useQuery({ queryKey: ["countries"], queryFn: fetchCountries });
  const categoriesQuery = useQuery({ queryKey: ["product_categories"], queryFn: fetchCategories });
  const fxQuery = useQuery({ queryKey: ["exchange_rate", "USD_BDT"], queryFn: fetchUsdBdt, staleTime: 60_000 });

  const usdToBdt = fxQuery.data ?? 120;

  const amount = useMemo(() => {
    const n = Number(amountInput || 0);
    if (!Number.isFinite(n) || n < 0) return 0;
    return currency === "USD" ? n * usdToBdt : n;
  }, [amountInput, currency, usdToBdt]);

  const country = useMemo(
    () => (countriesQuery.data ?? []).find((c) => c.id === countryId) ?? null,
    [countriesQuery.data, countryId],
  );
  const category = useMemo(
    () => (categoriesQuery.data ?? []).find((c) => c.id === categoryId) ?? null,
    [categoriesQuery.data, categoryId],
  );

  const countryRate = useMemo(() => {
    if (!country) return 0;
    return type === "import" ? Number(country.import_tax_rate ?? 0) : Number(country.export_tax_rate ?? 0);
  }, [country, type]);

  const categoryRate = Number(category?.base_tax_rate ?? 0);

  const calc = useMemo(
    () => calculateTradeTax({ type, amount: Number(amount || 0), countryRate, categoryRate }),
    [type, amount, countryRate, categoryRate],
  );

  const canSave = Boolean(user?.id && countryId && categoryId && productName.trim().length >= 2 && amount > 0);

  const onSave = async () => {
    if (!user || !canSave) return;

    const parsed = formSchema.safeParse({ productName, amount: amountInput });
    if (!parsed.success) {
      toast.error("Please check inputs.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("import_export_records").insert({
        user_id: user.id,
        type,
        country: country?.name ?? "",
        product_category: category?.name ?? "",
        product_name: productName.trim(),
        amount,
        calculated_tax: calc.calculatedTax,
        calculation_data: {
          rate: calc.rate,
          country_rate: countryRate,
          category_rate: categoryRate,
          input_currency: currency,
          input_amount: Number(amountInput || 0),
          usd_bdt_rate: usdToBdt,
          country_code: country?.code,
          country_id: countryId,
          category_id: categoryId,
        },
      });
      if (error) throw error;
      toast.success("Saved to history");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Import / Export Calculator</h1>
          <p className="mt-2 text-muted-foreground">Select country and product category to calculate duty/tax and save records.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-[var(--shadow-elev)]">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TradeType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="import">Import</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Country</Label>
                <Select value={countryId} onValueChange={setCountryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={countriesQuery.isLoading ? "Loading..." : "Select country"} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {(countriesQuery.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Product category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesQuery.isLoading ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {(categoriesQuery.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product">Product name</Label>
                <Input id="product" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Machinery" />
              </div>

              <div className="grid gap-2">
                <Label>{currency === "USD" ? "Amount (USD)" : "Amount (BDT)"}</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        <SelectItem value="BDT">BDT</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input id="amount" inputMode="decimal" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
                  </div>
                </div>
                {currency === "USD" ? (
                  <p className="text-xs text-muted-foreground">USD→BDT rate: {usdToBdt.toFixed(2)} (editable by admin)</p>
                ) : null}
              </div>

              <Separator />

              <div className="rounded-lg border bg-card/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total rate</span>
                  <span className="font-medium">{calc.rate.toFixed(2)}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Calculated tax</span>
                  <span className="text-xl font-semibold">৳ {formatBDT(calc.calculatedTax)}</span>
                </div>
                {currency === "USD" ? (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Converted amount</span>
                    <span className="font-medium">৳ {formatBDT(amount)}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button onClick={onSave} disabled={!canSave || saving}>
                  {saving ? "Saving..." : "Save to history"}
                </Button>
                <Button variant="outline" asChild>
                  <a href="/trade/history">View history</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elev)]">
            <CardHeader>
              <CardTitle>Rates breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Country rate</span>
                <span className="font-medium">{countryRate.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category rate</span>
                <span className="font-medium">{categoryRate.toFixed(2)}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{calc.rate.toFixed(2)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Configure rates in the Countries and Product Categories tables.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
