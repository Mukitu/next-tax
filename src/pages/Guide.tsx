import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/providers/i18n-provider";

export default function GuidePage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <div className="container py-10">
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{t("guide.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("guide.soon")}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
