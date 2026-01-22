import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { OfficerActivityLogRow } from "./types";

async function fetchOfficerLogs(officerId: string): Promise<OfficerActivityLogRow[]> {
  const { data, error } = await supabase
    .from("officer_activity_logs")
    .select("id, officer_id, activity_type, target_user_id, description, metadata, created_at")
    .eq("officer_id", officerId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as OfficerActivityLogRow[];
}

export function OfficerAuditLog() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [q, setQ] = useState("");

  const logsQuery = useQuery({
    queryKey: ["officer_logs", user?.id ?? null],
    queryFn: () => fetchOfficerLogs(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  const rows = logsQuery.data ?? [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const hay = `${r.activity_type} ${r.description} ${JSON.stringify(r.metadata ?? {})}`.toLowerCase();
      return hay.includes(s);
    });
  }, [q, rows]);

  return (
    <Card className="shadow-[var(--shadow-elev)]">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{t("officer.audit")}</CardTitle>
        <div className="w-full sm:w-80">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("officer.audit_search")} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("officer.audit_type")}</TableHead>
                <TableHead>{t("officer.audit_desc")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    {t("officer.audit_empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.created_at).toLocaleString("en-GB")}</TableCell>
                    <TableCell className="font-medium">{r.activity_type}</TableCell>
                    <TableCell className="text-muted-foreground">{r.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
