import { useAuth } from "@/providers/auth-provider";
import { AppShell } from "@/components/layout/AppShell";
import { useRole } from "@/hooks/use-role";
import { CitizenDashboard } from "@/components/dashboard/CitizenDashboard";
import { OfficerDashboard } from "@/components/dashboard/OfficerDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/providers/i18n-provider";

export default function DashboardPage() {
  const { user } = useAuth();
  const roleQuery = useRole();
  const role = roleQuery.data;
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">{t("dash.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("dash.signedin")} <span className="font-medium text-foreground">{user?.email}</span>.
          </p>
        </div>

        {roleQuery.isLoading ? (
          <Card className="shadow-[var(--shadow-elev)]">
            <CardHeader>
              <CardTitle>Loading</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("dash.loading")}</CardContent>
          </Card>
        ) : role === "officer" || role === "admin" ? (
          <OfficerDashboard />
        ) : (
          <CitizenDashboard />
        )}
      </div>
    </AppShell>
  );
}
