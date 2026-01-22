import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useI18n } from "@/providers/i18n-provider";
import { DateRangePicker, type DateRange } from "@/components/filters/DateRangePicker";
import { useMemo, useState } from "react";

type TaxRow = {
  id: string;
  created_at: string;
  total_income: number;
  total_expense: number;
  taxable_income: number;
  calculated_tax: number;
  fiscal_year: string;
};

function formatBDT(n: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
}

function formatMonth(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

async function fetchMyHistory(params: {
  userId: string;
  from?: Date;
  to?: Date;
  minTax?: number;
  maxTax?: number;
  page: number;
  pageSize: number;
}): Promise<{ rows: TaxRow[]; count: number }> {
  const start = params.page * params.pageSize;
  const end = start + params.pageSize - 1;

  let q = supabase
    .from("tax_calculations")
    .select("id, created_at, total_income, total_expense, taxable_income, calculated_tax, fiscal_year", { count: "exact" })
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false });

  if (params.from) q = q.gte("created_at", params.from.toISOString());
  if (params.to) {
    const endOfDay = new Date(params.to);
    endOfDay.setHours(23, 59, 59, 999);
    q = q.lte("created_at", endOfDay.toISOString());
  }
  if (Number.isFinite(params.minTax)) q = q.gte("calculated_tax", params.minTax!);
  if (Number.isFinite(params.maxTax)) q = q.lte("calculated_tax", params.maxTax!);

  const { data, error, count } = await q.range(start, end);
  if (error) throw error;
  return { rows: (data ?? []) as TaxRow[], count: count ?? 0 };
}

export function CitizenDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [range, setRange] = useState<DateRange>({});
  const [minTax, setMinTax] = useState<string>("");
  const [maxTax, setMaxTax] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const parsedMin = useMemo(() => (minTax.trim() === "" ? undefined : Number(minTax)), [minTax]);
  const parsedMax = useMemo(() => (maxTax.trim() === "" ? undefined : Number(maxTax)), [maxTax]);

  const historyQuery = useQuery({
    queryKey: ["tax_history", user?.id ?? null, range.from?.toISOString() ?? null, range.to?.toISOString() ?? null, parsedMin ?? null, parsedMax ?? null, page],
    queryFn: () =>
      fetchMyHistory({
        userId: user!.id,
        from: range.from,
        to: range.to,
        minTax: parsedMin,
        maxTax: parsedMax,
        page,
        pageSize,
      }),
    enabled: Boolean(user?.id),
  });

  const rows = historyQuery.data?.rows ?? [];
  const total = historyQuery.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const chartData = rows
    .slice()
    .reverse()
    .map((r) => ({
      month: formatMonth(r.created_at),
      tax: Number(r.calculated_tax),
      taxable: Number(r.taxable_income),
    }))
    .slice(-12);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("NEXT TAX — Tax History", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[t("table.date"), t("table.income"), t("table.expense"), t("table.taxable"), t("table.tax")] ],
      body: rows.slice(0, 50).map((r) => [
        new Date(r.created_at).toLocaleDateString("en-GB"),
        formatBDT(Number(r.total_income)),
        formatBDT(Number(r.total_expense)),
        formatBDT(Number(r.taxable_income)),
        formatBDT(Number(r.calculated_tax)),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 83, 130] },
    });
    doc.save("next-tax-history.pdf");
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-[var(--shadow-elev)] lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("citizen.monthly")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: any, name: any) => ["৳ " + formatBDT(Number(v)), String(name)]}
                />
                <Bar dataKey="taxable" name="Taxable" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="tax" name="Tax" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{t("citizen.actions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <a href="/tax">{t("citizen.newcalc")}</a>
            </Button>
            <Button variant="outline" onClick={exportPdf} disabled={rows.length === 0}>
              {t("citizen.exportpdf")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("citizen.pdf_hint")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-[var(--shadow-elev)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("citizen.history")}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {historyQuery.isLoading ? t("common.loading") : `${total} ${t("citizen.records")}`}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 rounded-lg border bg-card/40 p-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <Label>Date range</Label>
              <div className="mt-2">
                <DateRangePicker
                  value={range}
                  onChange={(r) => {
                    setRange(r);
                    setPage(0);
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="minTax">Min tax (BDT)</Label>
              <Input
                id="minTax"
                inputMode="decimal"
                value={minTax}
                onChange={(e) => {
                  setMinTax(e.target.value);
                  setPage(0);
                }}
                placeholder="0"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="maxTax">Max tax (BDT)</Label>
              <Input
                id="maxTax"
                inputMode="decimal"
                value={maxTax}
                onChange={(e) => {
                  setMaxTax(e.target.value);
                  setPage(0);
                }}
                placeholder="100000"
                className="mt-2"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead className="text-right">{t("table.income")}</TableHead>
                  <TableHead className="text-right">{t("table.expense")}</TableHead>
                  <TableHead className="text-right">{t("table.taxable")}</TableHead>
                  <TableHead className="text-right">{t("table.tax")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      {t("citizen.nohistory")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(Number(r.total_income))}</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(Number(r.total_expense))}</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(Number(r.taxable_income))}</TableCell>
                      <TableCell className="text-right font-medium">৳ {formatBDT(Number(r.calculated_tax))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Page {page + 1} of {pageCount}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page + 1 >= pageCount}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
