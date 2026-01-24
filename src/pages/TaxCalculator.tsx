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
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FiscalYear = { id: string; year_label: string };
type TaxSlab = { id: string; slab_from: number; slab_to: number | null; rate: number };
type TaxBreakdown = { from: number; to: number | null; amountInSlab: number; taxForSlab: number };
type TaxRequest = {
  id: string;
  fiscal_year: string;
  total_income: number;
  total_expense: number;
  taxable_income: number;
  calculated_tax: number;
  status: string;
  citizen?: { tin_number: string };
};

export default function TaxRequestPage() {
  const { user } = useAuth();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [taxSlabs, setTaxSlabs] = useState<TaxSlab[]>([]);
  const [requests, setRequests] = useState<TaxRequest[]>([]);

  const form = useForm<{ totalIncome: number; totalExpense: number }>({
    defaultValues: { totalIncome: undefined, totalExpense: undefined },
  });

  const wIncome = form.watch("totalIncome");
  const wExpense = form.watch("totalExpense");

  // Load fiscal years
  useEffect(() => {
    async function fetchFiscalYears() {
      const { data, error } = await supabase
        .from("fiscal_years")
        .select("id, year_label")
        .order("start_date", { ascending: false });
      if (error) toast.error(error.message);
      else setFiscalYears(data ?? []);
    }
    fetchFiscalYears();
  }, []);

  // Load slabs when year changes
  useEffect(() => {
    if (!selectedYearId) return;
    async function fetchSlabs() {
      const { data, error } = await supabase
        .from("tax_slabs")
        .select("id, slab_from, slab_to, rate")
        .eq("fiscal_year_id", selectedYearId)
        .eq("is_active", true)
        .order("slab_from");
      if (error) toast.error(error.message);
      else setTaxSlabs(data ?? []);
    }
    fetchSlabs();
  }, [selectedYearId]);

  const result = useMemo(() => {
    const slabs: TaxBreakdown[] = taxSlabs.map((s) => ({ from: s.slab_from, to: s.slab_to, amountInSlab: 0, taxForSlab: 0 }));
    return calculateBdTax({
      totalIncome: Number(wIncome || 0),
      totalExpense: Number(wExpense || 0),
      fiscalYear: fiscalYears.find((y) => y.id === selectedYearId)?.year_label,
      slabs: slabs.length ? slabs : undefined,
    });
  }, [wIncome, wExpense, taxSlabs, selectedYearId, fiscalYears]);

  const formatBDT = (n: number) => new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);

  // Save to History → tax_calculations
  const onSave = async () => {
    if (!user) return;
    try {
      const payload = result;
      const { error } = await supabase.from("tax_calculations").insert({
        user_id: user.id,
        fiscal_year: payload.fiscalYear,
        total_income: payload.totalIncome,
        total_expense: payload.totalExpense,
        taxable_income: payload.taxableIncome,
        calculated_tax: payload.calculatedTax,
      });
      if (error) throw error;
      toast.success("Saved to history");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  };

  // Request Officer Review → tax_requests
  const onSubmitRequest = async () => {
    if (!user) return;
    try {
      const payload = result;
      const { error } = await supabase.from("tax_requests").insert({
        citizen_id: user.id,
        fiscal_year: payload.fiscalYear,
        total_income: payload.totalIncome,
        total_expense: payload.totalExpense,
        taxable_income: payload.taxableIncome,
        calculated_tax: payload.calculatedTax,
        calculation_data: JSON.stringify({
          totalIncome: payload.totalIncome,
          totalExpense: payload.totalExpense,
          taxableIncome: payload.taxableIncome,
          breakdown: payload.breakdown,
        }),
        status: "submitted",
      });
      if (error) throw error;
      toast.success("Request submitted for officer review");
      fetchRequests(); // refresh list
    } catch (e: any) {
      toast.error(e?.message ?? "Submit failed");
    }
  };

  const fetchRequests = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tax_requests")
      .select(`
        *,
        citizen:citizen_id (
          tin_number
        )
      `)
      .eq("citizen_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.log(error);
    else setRequests(data ?? []);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const onReset = () => {
    form.reset({ totalIncome: undefined, totalExpense: undefined });
    setSelectedYearId(null);
  };

  return (
    <AppShell>
      <div className="container py-10">
        <h1 className="text-3xl font-semibold mb-4">Tax Request / Calculator</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fiscal Year</Label>
                <Select value={selectedYearId ?? ""} onValueChange={(v) => setSelectedYearId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.year_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Total Income</Label>
                <Input type="number" {...form.register("totalIncome")} />
              </div>

              <div>
                <Label>Total Expense</Label>
                <Input type="number" {...form.register("totalExpense")} />
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={onSave}>Save to History</Button>
                <Button onClick={onSubmitRequest}>Request Officer Review</Button>
                <Button variant="outline" onClick={onReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
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
                  {result.breakdown.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>৳ {formatBDT(l.from)} – {l.to ? `৳ ${formatBDT(l.to)}` : "Above"}</TableCell>
                      <TableCell className="text-right">{Math.round(l.rate * 100)}%</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(l.amountInSlab)}</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(l.taxForSlab)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <div>Taxable Income: ৳ {formatBDT(result.taxableIncome)}</div>
                <div>Calculated Tax: ৳ {formatBDT(result.calculatedTax)}</div>
              </div>

              {/* Requests list */}
              <Separator className="my-4" />
              <h2 className="text-lg font-medium mb-2">Your Requests</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>TIN</TableHead>
                    <TableHead className="text-right">Calculated Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.fiscal_year}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.citizen?.tin_number ?? "N/A"}</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(r.calculated_tax)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
