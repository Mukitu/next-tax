"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";

type TradeRow = {
  id: string;
  created_at: string;
  type: string;
  country: string;
  product_category: string;
  product_name: string;
  amount: number;
  calculated_tax: number;
};

function formatBDT(n: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
}

async function fetchMyTrade(userId: string): Promise<TradeRow[]> {
  const { data, error } = await supabase
    .from("import_export_records")
    .select("id, created_at, type, country, product_category, product_name, amount, calculated_tax")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as TradeRow[];
}

export default function TradeHistoryPage() {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["trade_history", user?.id ?? null],
    queryFn: () => fetchMyTrade(user!.id),
    enabled: Boolean(user?.id),
  });

  const rows = q.data ?? [];

  // Calculate total amounts
  const totalAmount = rows.reduce((acc, r) => acc + r.amount, 0);
  const totalTax = rows.reduce((acc, r) => acc + r.calculated_tax, 0);
  const finalTotal = totalAmount + totalTax;

  return (
    <AppShell>
      <div className="container py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Import / Export History</h1>
            <p className="mt-2 text-muted-foreground">Your saved import/export records.</p>
          </div>
          <Button asChild>
            <a href="/trade">New record</a>
          </Button>
        </div>

        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Records</CardTitle>
            <div className="text-sm text-muted-foreground">{q.isLoading ? "Loading..." : `${rows.length} records`}</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        No records yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.slice(0, 40).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{new Date(r.created_at).toLocaleDateString("en-GB")}</TableCell>
                        <TableCell className="capitalize">{r.type}</TableCell>
                        <TableCell>{r.country}</TableCell>
                        <TableCell>{r.product_category}</TableCell>
                        <TableCell>{r.product_name}</TableCell>
                        <TableCell className="text-right">৳ {formatBDT(r.amount)}</TableCell>
                        <TableCell className="text-right font-medium">৳ {formatBDT(r.calculated_tax)}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">৳ {formatBDT(r.amount + r.calculated_tax)}</TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Total Row */}
                  {rows.length > 0 && (
                    <TableRow className="bg-muted/10 font-semibold">
                      <TableCell colSpan={5} className="text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right">৳ {formatBDT(totalAmount)}</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(totalTax)}</TableCell>
                      <TableCell className="text-right text-green-700">৳ {formatBDT(finalTotal)}</TableCell>
                    </TableRow>
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
