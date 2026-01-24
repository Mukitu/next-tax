import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { calculateBdTax } from "@/lib/tax/bdTax";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FiscalYear = { id: string; year_label: string };
type TaxSlab = { id: string; slab_from: number; slab_to: number | null; rate: number };

export default function TaxCalculatorPage() {
  const { user } = useAuth();

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [taxSlabs, setTaxSlabs] = useState<TaxSlab[]>([]);

  const form = useForm<{ totalIncome: number; totalExpense: number }>({
    defaultValues: {
      totalIncome: 0,
      totalExpense: 0,
    },
  });

  const wIncome = form.watch("totalIncome");
  const wExpense = form.watch("totalExpense");

  /* =======================
     Load Fiscal Years
  ======================== */
  useEffect(() => {
    supabase
      .from("fiscal_years")
      .select("id, year_label")
      .order("start_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setFiscalYears(data ?? []);
      });
  }, []);

  /* =======================
     Load Tax Slabs
  ======================== */
  useEffect(() => {
    if (!selectedYearId) return;

    supabase
      .from("tax_slabs")
      .select("id, slab_from, slab_to, rate")
      .eq("fiscal_year_id", selectedYearId)
      .eq("is_active", true)
      .order("slab_from")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setTaxSlabs(data ?? []);
      });
  }, [selectedYearId]);

  /* =======================
     Tax Calculation
  ======================== */
  const result = useMemo(() => {
    const slabs = taxSlabs.map((s) => ({
      from: s.slab_from,
      to: s.slab_to,
      rate: s.rate,
    }));

    return calculateBdTax({
      totalIncome: Number(wIncome || 0),
      totalExpense: Number(wExpense || 0),
      fiscalYear: fiscalYears.find((y) => y.id === selectedYearId)?.year_label,
      slabs,
    });
  }, [wIncome, wExpense, taxSlabs, selectedYearId, fiscalYears]);

  const formatBDT = (n: number) =>
    new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);

  /* =======================
     Save History
  ======================== */
  const onSaveHistory = async () => {
    if (!user) return;

    const { error } = await supabase.from("tax_calculations").insert({
      user_id: user.id,
      fiscal_year: result.fiscalYear,
      total_income: result.totalIncome,
      total_expense: result.totalExpense,
      taxable_income: result.taxableIncome,
      calculated_tax: result.calculatedTax,
      calculation_data: result,
    });

    if (error) toast.error(error.message);
    else toast.success("Saved to history");
  };

  /* =======================
     Request Officer Review
  ======================== */
  const onRequestReview = async () => {
    if (!user) return;

    const { error } = await supabase.from("tax_requests").insert({
      citizen_id: user.id,
      fiscal_year: result.fiscalYear,
      total_income: result.totalIncome,
      total_expense: result.totalExpense,
      taxable_income: result.taxableIncome,
      calculated_tax: result.calculatedTax,
      calculation_data: result,
      status: "pending",
    });

    if (error) toast.error(error.message);
    else toast.success("Tax request sent for officer review");
  };

  /* =======================
     Reset Form
  ======================== */
  const onReset = () => {
    form.reset({
      totalIncome: 0,
      totalExpense: 0,
    });
    setSelectedYearId(null);
    setTaxSlabs([]);
  };

  return (
    <AppShell>
      <div className="container py-10">
        <h1 className="text-3xl font-semibold mb-6">Tax Calculator</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ================= Inputs ================= */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fiscal Year</Label>
                <Select value={selectedYearId ?? ""} onValueChange={setSelectedYearId}>
                  <SelectTrigger />
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
                <Label>Total Income</Label>
                <Input type="number" {...form.register("totalIncome", { valueAsNumber: true })} />
              </div>

              <div>
                <Label>Total Expense</Label>
                <Input type="number" {...form.register("totalExpense", { valueAsNumber: true })} />
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button onClick={onSaveHistory}>Save to History</Button>
                <Button variant="secondary" onClick={onRequestReview}>
                  Request Officer Review
                </Button>
                <Button variant="destructive" onClick={onReset}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ================= Breakdown ================= */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {result.breakdown.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        ৳ {formatBDT(b.from)} – {b.to ? `৳ ${formatBDT(b.to)}` : "Above"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(b.rate * 100)}%
                      </TableCell>
                      <TableCell className="text-right">
                        ৳ {formatBDT(b.amountInSlab)}
                      </TableCell>
                      <TableCell className="text-right">
                        ৳ {formatBDT(b.taxForSlab)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 space-y-1 font-medium">
                <div>Taxable Income: ৳ {formatBDT(result.taxableIncome)}</div>
                <div>Calculated Tax: ৳ {formatBDT(result.calculatedTax)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
