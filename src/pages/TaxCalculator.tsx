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
import { calculateBdTax } from "@/lib/tax/bdTax";
import { useFiscalYears, useTaxSlabs } from "@/hooks/use-tax-slabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/providers/i18n-provider";

const schema = z.object({
  totalIncome: z.coerce.number().min(0).max(1_000_000_000),
  totalExpense: z.coerce.number().min(0).max(1_000_000_000),
});

type Values = z.infer<typeof schema>;

function formatBDT(n: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
}

export default function TaxCalculatorPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const yearsQuery = useFiscalYears();
  const [year, setYear] = useState<string | null>(null);
  const slabsQuery = useTaxSlabs(year);

  useEffect(() => {
    if (!year && (yearsQuery.data?.length ?? 0) > 0) setYear(yearsQuery.data![0]);
  }, [year, yearsQuery.data]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { totalIncome: 0, totalExpense: 0 },
    mode: "onChange",
  });

  const wIncome = form.watch("totalIncome");
  const wExpense = form.watch("totalExpense");

  const result = useMemo(() => {
    const slabs = (slabsQuery.data ?? []).map((s) => ({
      from: s.slab_from,
      to: s.slab_to,
      rate: s.rate,
    }));
    return calculateBdTax({
      totalIncome: Number(wIncome || 0),
      totalExpense: Number(wExpense || 0),
      fiscalYear: year ?? undefined,
      slabs: slabs.length ? slabs : undefined,
    });
  }, [wIncome, wExpense, slabsQuery.data, year]);

  // Save to history
  const onSave = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form.getValues());
    if (!parsed.success) {
      toast.error("Please fix the input values.");
      return;
    }

    setSaving(true);
    try {
      const payload = calculateBdTax({
        totalIncome: parsed.data.totalIncome,
        totalExpense: parsed.data.totalExpense,
        fiscalYear: year ?? undefined,
        slabs: (slabsQuery.data ?? []).map((s) => ({
          from: s.slab_from,
          to: s.slab_to,
          rate: s.rate,
        })),
      });

      const { error } = await supabase.from("tax_calculations").insert({
        user_id: user.id,
        officer_id: null,
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

  // Request officer review
  const onRequestReview = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form.getValues());
    if (!parsed.success) {
      toast.error("Please fix the input values.");
      return;
    }

    setRequesting(true);
    try {
      const payload = calculateBdTax({
        totalIncome: parsed.data.totalIncome,
        totalExpense: parsed.data.totalExpense,
        fiscalYear: year ?? undefined,
        slabs: (slabsQuery.data ?? []).map((s) => ({
          from: s.slab_from,
          to: s.slab_to,
          rate: s.rate,
        })),
      });

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
      toast.success(t("tax.request_sent"));
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
          <p className="mt-2 text-muted-foreground">{t("tax.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-[var(--shadow-elev)]">
            <CardHeader>
              <CardTitle>{t("tax.inputs")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-2">
                  <Label>{t("tax.fiscal_year")}</Label>
                  <Select value={year ?? ""} onValueChange={(v) => setYear(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={yearsQuery.isLoading ? t("common.loading") : t("tax.select_year")} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {(yearsQuery.data ?? []).map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("tax.year_hint")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income">{t("tax.income")}</Label>
                  <Input id="income" inputMode="decimal" {...form.register("totalIncome")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense">{t("tax.expense")}</Label>
                  <Input id="expense" inputMode="decimal" {...form.register("totalExpense")} />
                </div>

                <Separator />

                <div className="grid gap-3 rounded-lg border bg-card/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("tax.taxable")}</span>
                    <span className="font-medium">৳ {formatBDT(result.taxableIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("tax.calculated")}</span>
                    <span className="text-xl font-semibold">৳ {formatBDT(result.calculatedTax)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={onSave} disabled={saving} className="sm:w-auto">
                    {saving ? t("tax.saving") : t("tax.save")}
                  </Button>
                  <Button type="button" variant="outline" onClick={onRequestReview} disabled={requesting}>
                    {requesting ? t("tax.requesting") : t("tax.request_review")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => form.reset({ totalIncome: 0, totalExpense: 0 })}>
                    {t("tax.reset")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elev)]">
            <CardHeader>
              <CardTitle>{t("tax.breakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
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
                        <TableCell className="font-medium">৳ {formatBDT(l.from)} – {l.to ? `৳ ${formatBDT(l.to)}` : "Above"}</TableCell>
                        <TableCell className="text-right">{Math.round(l.rate * 100)}%</TableCell>
                        <TableCell className="text-right">৳ {formatBDT(l.amountInSlab)}</TableCell>
                        <TableCell className="text-right">৳ {formatBDT(l.taxForSlab)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t("tax.note")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
