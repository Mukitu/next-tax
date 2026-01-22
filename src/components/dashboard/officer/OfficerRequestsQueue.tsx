import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { calculateBdTax } from "@/lib/tax/bdTax";
import { fetchTaxSlabs } from "@/hooks/use-tax-slabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { TaxRequestRow } from "./types";

function formatBDT(n: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
}

async function fetchSubmittedRequests(): Promise<TaxRequestRow[]> {
  const { data, error } = await supabase
    .from("tax_requests")
    .select(
      "id, citizen_id, fiscal_year, total_income, total_expense, taxable_income, calculated_tax, calculation_data, status, officer_id, officer_note, created_at, updated_at",
    )
    .eq("status", "submitted")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as TaxRequestRow[];
}

async function approveRequest(params: { officerId: string; req: TaxRequestRow; note?: string }) {
  // Recompute from submitted totals (avoid trusting precomputed fields)
  const slabs = await fetchTaxSlabs(params.req.fiscal_year);
  const payload = calculateBdTax({
    totalIncome: Number(params.req.total_income),
    totalExpense: Number(params.req.total_expense),
    fiscalYear: params.req.fiscal_year,
    slabs: slabs.map((s) => ({ from: s.slab_from, to: s.slab_to, rate: s.rate })),
  });

  const { error: insertErr } = await supabase.from("tax_calculations").insert({
    user_id: params.req.citizen_id,
    officer_id: params.officerId,
    fiscal_year: payload.fiscalYear,
    total_income: payload.totalIncome,
    total_expense: payload.totalExpense,
    taxable_income: payload.taxableIncome,
    calculated_tax: payload.calculatedTax,
    calculation_data: { breakdown: payload.breakdown, created_by: "officer", source_request_id: params.req.id },
  });
  if (insertErr) throw insertErr;

  const { error: updErr } = await supabase
    .from("tax_requests")
    .update({ status: "approved", officer_id: params.officerId, officer_note: params.note ?? null })
    .eq("id", params.req.id);
  if (updErr) throw updErr;

  // audit log (best-effort)
  void supabase.from("officer_activity_logs").insert({
    officer_id: params.officerId,
    activity_type: "REQUEST_APPROVED",
    target_user_id: params.req.citizen_id,
    description: `Approved tax review request ${params.req.id}`,
    metadata: { requestId: params.req.id, calculatedTax: payload.calculatedTax },
  });
}

async function rejectRequest(params: { officerId: string; reqId: string; citizenId: string; note?: string }) {
  const { error: updErr } = await supabase
    .from("tax_requests")
    .update({ status: "rejected", officer_id: params.officerId, officer_note: params.note ?? null })
    .eq("id", params.reqId);
  if (updErr) throw updErr;

  void supabase.from("officer_activity_logs").insert({
    officer_id: params.officerId,
    activity_type: "REQUEST_REJECTED",
    target_user_id: params.citizenId,
    description: `Rejected tax review request ${params.reqId}`,
    metadata: { requestId: params.reqId },
  });
}

export function OfficerRequestsQueue() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["officer_requests_submitted"],
    queryFn: fetchSubmittedRequests,
    staleTime: 10_000,
  });

  const approveMut = useMutation({
    mutationFn: (req: TaxRequestRow) => approveRequest({ officerId: user!.id, req, note: noteById[req.id] }),
    onSuccess: async () => {
      toast.success(t("officer.req_approved"));
      await qc.invalidateQueries({ queryKey: ["officer_requests_submitted"] });
      await qc.invalidateQueries({ queryKey: ["officer_logs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Approve failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (req: TaxRequestRow) =>
      rejectRequest({ officerId: user!.id, reqId: req.id, citizenId: req.citizen_id, note: noteById[req.id] }),
    onSuccess: async () => {
      toast.success(t("officer.req_rejected"));
      await qc.invalidateQueries({ queryKey: ["officer_requests_submitted"] });
      await qc.invalidateQueries({ queryKey: ["officer_logs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Reject failed"),
  });

  const rows = q.data ?? [];
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.citizen_id} ${r.fiscal_year}`.toLowerCase().includes(s));
  }, [rows, search]);

  return (
    <Card className="shadow-[var(--shadow-elev)]">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{t("officer.requests")}</CardTitle>
        <div className="w-full sm:w-80">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("officer.req_search")} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("officer.req_citizen")}</TableHead>
                <TableHead className="text-right">{t("table.income")}</TableHead>
                <TableHead className="text-right">{t("table.expense")}</TableHead>
                <TableHead className="text-right">{t("table.tax")}</TableHead>
                <TableHead>{t("officer.req_note")}</TableHead>
                <TableHead className="text-right">{t("officer.req_action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {t("officer.req_empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const busy = approveMut.isPending || rejectMut.isPending;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleString("en-GB")}</TableCell>
                      <TableCell className="font-mono text-xs">{r.citizen_id.slice(0, 8)}…</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(Number(r.total_income))}</TableCell>
                      <TableCell className="text-right">৳ {formatBDT(Number(r.total_expense))}</TableCell>
                      <TableCell className="text-right font-medium">৳ {formatBDT(Number(r.calculated_tax))}</TableCell>
                      <TableCell>
                        <div className="grid gap-2">
                          <Label className="sr-only" htmlFor={`note_${r.id}`}>
                            Note
                          </Label>
                          <Input
                            id={`note_${r.id}`}
                            value={noteById[r.id] ?? ""}
                            onChange={(e) => setNoteById((p) => ({ ...p, [r.id]: e.target.value }))}
                            placeholder={t("officer.req_note_ph")}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMut.mutate(r)}
                            disabled={!user?.id || busy}
                          >
                            {t("officer.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMut.mutate(r)}
                            disabled={!user?.id || busy}
                          >
                            {t("officer.reject")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
