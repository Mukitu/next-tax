import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type BdTaxSlab = { from: number; to: number | null; rate: number };
type BdTaxBreakdownLine = {
  from: number;
  to: number | null;
  rate: number;
  amountInSlab: number;
  taxForSlab: number;
};

type BdTaxResult = {
  fiscalYear: string;
  totalIncome: number;
  totalExpense: number;
  taxableIncome: number;
  calculatedTax: number;
  breakdown: BdTaxBreakdownLine[];
};

// Bangladesh progressive tax slabs
const DEFAULT_SLABS: BdTaxSlab[] = [
  { from: 0, to: 350000, rate: 0 },
  { from: 350000, to: 450000, rate: 0.05 },
  { from: 450000, to: 750000, rate: 0.1 },
  { from: 750000, to: 1100000, rate: 0.15 },
  { from: 1100000, to: 1600000, rate: 0.2 },
  { from: 1600000, to: null, rate: 0.25 },
];

function clampMoney(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

function calculateBdTax(params: {
  totalIncome: number;
  totalExpense: number;
  fiscalYear?: string;
  slabs?: BdTaxSlab[];
}): BdTaxResult {
  const fiscalYear = params.fiscalYear ?? "2026-2027";
  const totalIncome = clampMoney(params.totalIncome);
  const totalExpense = clampMoney(params.totalExpense);
  const taxableIncome = clampMoney(totalIncome - totalExpense);

  const activeSlabs = (params.slabs && params.slabs.length ? params.slabs : DEFAULT_SLABS).map((s) => ({
    from: Number(s.from),
    to: s.to === null ? null : Number(s.to),
    rate: Number(s.rate),
  }));

  const breakdown: BdTaxBreakdownLine[] = activeSlabs
    .map((s) => {
      const upper = s.to ?? Number.POSITIVE_INFINITY;
      const amountInSlab = Math.max(0, Math.min(taxableIncome, upper) - s.from);
      const taxForSlab = clampMoney(amountInSlab * s.rate);
      return { from: s.from, to: s.to, rate: s.rate, amountInSlab, taxForSlab };
    })
    .filter((l) => l.amountInSlab > 0 || l.rate === 0);

  const calculatedTax = clampMoney(breakdown.reduce((sum, l) => sum + l.taxForSlab, 0));

  return { fiscalYear, totalIncome, totalExpense, taxableIncome, calculatedTax, breakdown };
}

// Validation schema
const schema = z.object({
  totalIncome: z.coerce.number().min(0).max(1_000_000_000),
  totalExpense: z.coerce.number().min(0).max(1_000_000_000),
});

type Values = z.infer<typeof schema>;

export default function TaxCalculatorPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [fiscalYears, setFiscalYears] = useState<{ id: string; year_label: string }[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [taxSlabs, setTaxSlabs] = useState<BdTaxSlab[]>([]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { totalIncome: 0, totalExpense: 0 },
    mode: "onChange",
  });

  // Format BDT
  const formatBDT = (n: number) => new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);

  // Load fiscal years from Supabase
  useEffect(() => {
    const loadYears = async () => {
      const { data } = await supabase.from("fiscal_years").select("id, year_label").order("start_date", { ascending: false });
      if (data) setFiscalYears(data);
      if (data?.length) setSelectedYearId(data[0].id);
    };
    loadYears();
  }, []);

  // Load tax slabs for selected year
  useEffect(() => {
    if (!selectedYearId) return;
    const loadSlabs = async () => {
      const { data } = await supabase
        .from("tax_slabs")
        .select("slab_from, slab_to, rate")
        .eq("fiscal_year_id", selectedYearId)
        .eq("is_active", true)
        .order("slab_from");
      if (data) setTaxSlabs(data.map((s: any) => ({ from: s.slab_from, to: s.slab_to, rate: s.rate })));
    };
    loadSlabs();
  }, [selectedYearId]);

  const watchedIncome = form.watch("totalIncome");
  const watchedExpense = form.watch("totalExpense");

  const result = useMemo(
    () => calculateBdTax({ totalIncome: watchedIncome, totalExpense: watchedExpense, fiscalYear: fiscalYears.find((y) => y.id === selectedYearId)?.year_label, slabs: taxSlabs }),
    [watchedIncome, watchedExpense, taxSlabs, selectedYearId, fiscalYears]
  );

  const onSave = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form.getValues());
    if (!parsed.success) return toast.error("Invalid inputs");
    setSaving(true);
    try {
      const payload = calculateBdTax({ totalIncome: parsed.data.totalIncome, totalExpense: parsed.data.totalExpense, fiscalYear: fiscalYears.find((y) => y.id === selectedYearId)?.year_label, slabs: taxSlabs });
      const { error } = await supabase.from("tax_calculations").insert({
        user_id: user.id,
        fiscal_year: payload.fiscalYear,
        total_income: payload.totalIncome,
        total_expense: payload.totalExpense,
        taxable_income: payload.taxableIncome,
        calculated_tax: payload.calculatedTax,
        calculation_data: { breakdown: payload.breakdown },
      });
      if (error) throw error;
      toast.success("Saved to history");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onRequestReview = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form.getValues());
    if (!parsed.success) return toast.error("Invalid inputs");
    setRequesting(true);
    try {
      const payload = calculateBdTax({ totalIncome: parsed.data.totalIncome, totalExpense: parsed.data.totalExpense, fiscalYear: fiscalYears.find((y) => y.id === selectedYearId)?.year_label, slabs: taxSlabs });
      const { error } = await supabase.from("tax_requests").insert({
        citizen_id: user.id,
        fiscal_year: payload.fiscalYear,
        total_income: payload.totalIncome,
        total_expense: payload.totalExpense,
        taxable_income: payload.taxableIncome,
        calculated_tax: payload.calculatedTax,
        calculation_data: { breakdown: payload.breakdown, created_by: "citizen" },
      });
      if (error) throw error;
      toast.success("Request sent for officer review");
    } catch (e: any) {
      toast.error(e?.message ?? "Request failed");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <AppShell>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Tax Calculator</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Inputs Card */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <Label>Fiscal Year</Label>
                  <Select value={selectedYearId ?? ""} onValueChange={setSelectedYearId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {fiscalYears.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.year_label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Total Income (BDT)</Label>
                  <Input type="number" {...form.register("totalIncome")} />
                </div>
                <div>
                  <Label>Total Expense (BDT)</Label>
                  <Input type="number" {...form.register("totalExpense")} />
                </div>

                <Separator />

                <div className="grid gap-2 border rounded-lg p-4 bg-card/50">
                  <div className="flex justify-between">
                    <span>Taxable Income</span>
                    <span>৳ {formatBDT(result.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calculated Tax</span>
                    <span>৳ {formatBDT(result.calculatedTax)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save to history"}</Button>
                  <Button onClick={onRequestReview} disabled={requesting} variant="outline">{requesting ? "Requesting..." : "Request officer review"}</Button>
                  <Button variant="outline" onClick={() => form.reset({ totalIncome: 0, totalExpense: 0 })}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Breakdown Card */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slab</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.breakdown.map((l) => (
                      <TableRow key={`${l.from}-${l.to ?? "inf"}-${l.rate}`}>
                        <TableCell>৳ {formatBDT(l.from)} – {l.to ? `৳ ${formatBDT(l.to)}` : "Above"}</TableCell>
                        <TableCell className="text-right">{Math.round(l.rate * 100)}%</TableCell>
                        <TableCell className="text-right">৳ {formatBDT(l.amountInSlab)}</TableCell>
                        <TableCell className="text-right">৳ {formatBDT(l.taxForSlab)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
