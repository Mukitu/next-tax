import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Calculator, LogIn, LogOut, ShieldCheck, Ship } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import logo from "@/assets/next-tax-logo.png";
import { useI18n } from "@/providers/i18n-provider";

const navItemBase =
  "text-sm font-medium text-foreground/80 hover:text-foreground transition-colors";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { lang, toggle, t } = useI18n();

  const showDashboard = useMemo(() => Boolean(user), [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NEXT TAX logo" className="h-8 w-8" loading="eager" />
              <div className="leading-tight">
                <div className="font-semibold tracking-tight">NEXT TAX</div>
                <div className="text-xs text-muted-foreground">Government Tax Platform</div>
              </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" className={navItemBase} activeClassName="text-foreground">
              {t("nav.home")}
            </NavLink>
            <NavLink to="/guide" className={navItemBase} activeClassName="text-foreground">
              {t("nav.guide")}
            </NavLink>
            <NavLink to="/team" className={navItemBase} activeClassName="text-foreground">
              {t("nav.team")}
            </NavLink>
            {showDashboard && (
              <NavLink
                to="/dashboard"
                className={cn(navItemBase, "flex items-center gap-2")}
                activeClassName="text-foreground"
              >
                <ShieldCheck className="h-4 w-4" />
                {t("nav.dashboard")}
              </NavLink>
            )}
            {showDashboard && (
              <NavLink
                to="/tax"
                className={cn(navItemBase, "flex items-center gap-2")}
                activeClassName="text-foreground"
              >
                <Calculator className="h-4 w-4" />
                {t("nav.tax")}
              </NavLink>
            )}
            {showDashboard && (
              <NavLink
                to="/trade"
                className={cn(navItemBase, "flex items-center gap-2")}
                activeClassName="text-foreground"
              >
                <Ship className="h-4 w-4" />
                {t("nav.trade")}
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language toggle placeholder (English/বাংলা) */}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={toggle}
              aria-label="Toggle language"
            >
              {lang === "en" ? "EN" : "বাংলা"} ↔ {lang === "en" ? "বাংলা" : "EN"}
            </Button>

            {!user ? (
              <Button asChild size="sm" className="gap-2">
                <a href="/auth">
                  <LogIn className="h-4 w-4" />
                  {t("nav.login")}
                </a>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Keep sync: signOut handles auth state.
                  void signOut();
                  if (location.pathname.startsWith("/dashboard")) {
                    window.location.href = "/";
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t">
        <div className="container py-8 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>{t("footer.rights")}</div>
            <a
              href="https://mukituislamnishat.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              {t("footer.madeby")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
