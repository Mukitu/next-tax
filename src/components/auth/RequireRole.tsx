import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole, type AppRole } from "@/hooks/use-role";
import { useI18n } from "@/providers/i18n-provider";

export function RequireRole({ allow, children }: { allow: AppRole[]; children: React.ReactNode }) {
  const { t } = useI18n();
  const roleQuery = useRole();
  const role = roleQuery.data;

  if (roleQuery.isLoading) {
    return (
      <Card className="shadow-[var(--shadow-elev)]">
        <CardHeader>
          <CardTitle>{t("common.loading")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("dash.loading")}</CardContent>
      </Card>
    );
  }

  if (!role || !allow.includes(role)) {
    return (
      <Card className="shadow-[var(--shadow-elev)]">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">You do not have permission to view this page.</CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
