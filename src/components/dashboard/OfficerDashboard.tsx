import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useI18n } from "@/providers/i18n-provider";
import { calculateBdTax } from "@/lib/tax/bdTax";
import { OfficerRequestsQueue } from "@/components/dashboard/officer/OfficerRequestsQueue";
import { OfficerAuditLog } from "@/components/dashboard/officer/OfficerAuditLog";

type Profile = {
  id: string;
  email: string;
  tin_number: string | null;
  location: string | null;
  phone: string | null;
};

type TaxRow = {
  id: string;
  created_at: string;
  total_income: number;
  total_expense: number;
  taxable_income: number;
  calculated_tax: number;
};

const calcSchema = z.object({
  totalIncome: z.coerce.number().min(0).max(1_000_000_000),
  totalExpense: z.coerce.number().min(0).max(1_000_000_000),
});

function formatBDT(n: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
}

const tinSchema = z
  .string()
  .trim()
  .min(6, "Enter a valid TIN")
  .max(40, "Enter a valid TIN")
  .regex(/^[0-9A-Za-z-]+$/, "TIN format invalid");

async function findCitizenByTin(tin: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, tin_number, location, phone")
    .eq("tin_number", tin)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

async function fetchCitizenTax(userId: string): Promise<TaxRow[]> {
  const { data, error } = await supabase
    .from("tax_calculations")
    .select("id, created_at, total_income, total_expense, taxable_income, calculated_tax")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as TaxRow[];
}

export function OfficerDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [tin, setTin] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [income, setIncome] = useState<string>("");
  const [expense, setExpense] = useState<string>("");
  const [savingCalc, setSavingCalc] = useState(false);

  const tinValid = useMemo(() => tinSchema.safeParse(tin).success, [tin]);

  const taxQuery = useQuery({
    queryKey: ["officer_citizen_tax", selected?.id ?? null],
    queryFn: () => fetchCitizenTax(selected!.id),
    enabled: Boolean(selected?.id),
  });

  const onSearch = async () => {
    const parsed = tinSchema.safeParse(tin);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid TIN");
      return;
    }
    try {
      const profile = await findCitizenByTin(parsed.data);
      setSelected(profile);
      if (!profile) {
        toast.message(t("officer.none_found"));
        return;
      }

      // activity log (non-blocking)
      if (user?.id) {
        void supabase.from("officer_activity_logs").insert({
          officer_id: user.id,
          activity_type: "TIN_SEARCH",
          target_user_id: profile.id,
          description: `Searched citizen by TIN: ${parsed.data}`,
          metadata: { tin: parsed.data },
        });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Search failed");
    }
  };

  const rows = taxQuery.data ?? [];

  const officerCanSave = Boolean(user?.id && selected?.id);

  const onCreateCalc = async () => {
    if (!officerCanSave) return;
    const parsed = calcSchema.safeParse({ totalIncome: income, totalExpense: expense });
    if (!parsed.success) {
      toast.error("Please check income/expense values.");
      return;
    }
    setSavingCalc(true);
    try {
      const payload = calculateBdTax({ totalIncome: parsed.data.totalIncome, totalExpense: parsed.data.totalExpense });
      const { error } = await supabase.from("tax_calculations").insert({
        user_id: selected!.id,
        officer_id: user!.id,
        fiscal_year: payload.fiscalYear,
        total_income: payload.totalIncome,
        total_expense: payload.totalExpense,
        taxable_income: payload.taxableIncome,
        calculated_tax: payload.calculatedTax,
        calculation_data: { breakdown: payload.breakdown, created_by: "officer" },
      });
      if (error) throw error;

      void supabase.from("officer_activity_logs").insert({
        officer_id: user!.id,
        activity_type: "OFFICER_CALC_CREATE",
        target_user_id: selected!.id,
        description: `Created a tax calculation for citizen ${selected!.id}`,
        metadata: { totalIncome: payload.totalIncome, totalExpense: payload.totalExpense, calculatedTax: payload.calculatedTax },
      });

      toast.success("Calculation saved");
      setIncome("");
      setExpense("");
      void taxQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSavingCalc(false);
    }
  };

  return (
    <Tabs defaultValue="citizens" className="grid gap-6">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="citizens">{t("officer.tab_citizens")}</TabsTrigger>
        <TabsTrigger value="requests">{t("officer.requests")}</TabsTrigger>
        <TabsTrigger value="audit">{t("officer.audit")}</TabsTrigger>
      </TabsList>

      <TabsContent value="citizens" className="m-0 grid gap-6">
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{t("officer.lookup")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 sm:max-w-md">
              <Label htmlFor="tin">{t("officer.tin")}</Label>
              <div className="flex gap-2">
                <Input id="tin" value={tin} onChange={(e) => setTin(e.target.value)} placeholder="e.g. 123-456-789" />
                <Button type="button" onClick={onSearch} disabled={!tinValid}>
                  {t("officer.search")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("officer.hint")}</p>
            </div>

            {selected ? (
              <div className="rounded-lg border bg-card/40 p-4">
                <div className="text-sm font-medium">{t("officer.citizen")}</div>
                <div className="mt-1 text-sm text-muted-foreground">{selected.email}</div>
                <div className="mt-2 grid gap-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">TIN:</span> {selected.tin_number}
                  </div>
                  {selected.location ? (
                    <div>
                      <span className="text-muted-foreground">{t("officer.location")}:</span> {selected.location}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("officer.records")}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {taxQuery.isLoading ? t("common.loading") : `${rows.length} ${t("citizen.records")}`}
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />

            {selected ? (
              <div className="mb-6 rounded-lg border bg-card/40 p-4">
                <div className="text-sm font-medium">{t("officer.create_calc")}</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="off_income">{t("officer.total_income")}</Label>
                    <Input id="off_income" inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="off_expense">{t("officer.total_expense")}</Label>
                    <Input id="off_expense" inputMode="decimal" value={expense} onChange={(e) => setExpense(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={onCreateCalc} disabled={!officerCanSave || savingCalc} className="w-full">
                      {savingCalc ? t("tax.saving") : t("officer.save_calc")}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("officer.create_calc_hint")}</p>
              </div>
            ) : null}

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
                  {!selected ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        {t("officer.empty_search")}
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        {t("officer.empty_records")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.slice(0, 25).map((r) => (
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
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="requests" className="m-0">
        <OfficerRequestsQueue />
      </TabsContent>

      <TabsContent value="audit" className="m-0">
        <OfficerAuditLog />
      </TabsContent>
    </Tabs>
  );
}
