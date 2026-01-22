import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, Landmark, ShieldCheck } from "lucide-react";
import { useI18n } from "@/providers/i18n-provider";

const Index = () => {
  const { t } = useI18n();
  return (
    <AppShell>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "var(--gradient-primary)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

        <div className="container relative py-14 md:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur">
                  <BadgeCheck className="h-4 w-4 text-primary" /> {t("home.badge.secure")}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-primary" /> {t("home.badge.rls")}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur">
                  <Landmark className="h-4 w-4 text-primary" /> {t("home.badge.audit")}
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
                {t("home.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("home.subtitle")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="gap-2">
                  <a href="/auth">
                    {t("home.cta.start")} <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <a href="/guide">
                    <ShieldCheck className="h-4 w-4" />
                    {t("home.cta.guide")}
                  </a>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative">
                <div
                  className="absolute -inset-2 rounded-2xl opacity-40"
                  style={{ background: "var(--gradient-primary)" }}
                  aria-hidden="true"
                />
                <div className="relative rounded-2xl border bg-card/60 p-6 backdrop-blur shadow-[var(--shadow-elev)]">
                  <div className="text-sm font-medium">NEXT TAX</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Trusted workflows for citizens and authorized officers.
                  </div>
                  <div className="mt-6 grid gap-3">
                    {[
                      {
                        k: "home.feature.slabs",
                        d: "home.feature.slabs_desc",
                      },
                      {
                        k: "home.feature.history",
                        d: "home.feature.history_desc",
                      },
                      {
                        k: "home.feature.officer",
                        d: "home.feature.officer_desc",
                      },
                    ].map((x) => (
                      <Card key={x.k} className="bg-background/40 p-4 shadow-[var(--shadow-elev)]">
                        <div className="text-sm font-semibold tracking-tight">{t(x.k as any)}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{t(x.d as any)}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
