import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";
import DashboardPage from "./pages/Dashboard";
import GuidePage from "./pages/Guide";
import TeamPage from "./pages/Team";
import TaxCalculatorPage from "./pages/TaxCalculator";
import TradeCalculatorPage from "./pages/TradeCalculator";
import TradeHistoryPage from "./pages/TradeHistory";
import { AuthProvider } from "@/providers/auth-provider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { I18nProvider } from "@/providers/i18n-provider";
import TradeAdminPage from "./pages/admin/TradeAdmin";
import TaxSlabsAdminPage from "./pages/admin/TaxSlabsAdmin";
import { RequireRole } from "@/components/auth/RequireRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/reset" element={<ResetPasswordPage />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route
                path="/tax"
                element={
                  <RequireAuth>
                    <TaxCalculatorPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/trade"
                element={
                  <RequireAuth>
                    <TradeCalculatorPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/trade/history"
                element={
                  <RequireAuth>
                    <TradeHistoryPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/trade"
                element={
                  <RequireAuth>
                    <RequireRole allow={["admin"]}>
                      <TradeAdminPage />
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/tax-slabs"
                element={
                  <RequireAuth>
                    <RequireRole allow={["admin"]}>
                      <TaxSlabsAdminPage />
                    </RequireRole>
                  </RequireAuth>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
