import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/providers/i18n-provider";

type OfficeType = "tax" | "customs";
type SignupType = "citizen" | "tax_officer" | "customs_officer";

const baseSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

const citizenSchema = baseSchema.extend({
  phone: z.string().trim().min(7).max(30).optional(),
  location: z.string().trim().min(2).max(120),
  tin_number: z.string().trim().min(6).max(40),
});

const officerSchema = baseSchema.extend({
  officer_id: z.string().trim().min(3).max(40),
  office_location: z.string().trim().min(2).max(120),
});

const forgotSchema = z.object({
  email: z.string().trim().email().max(255),
});

type LoginValues = z.infer<typeof baseSchema>;
type CitizenValues = z.infer<typeof citizenSchema>;
type OfficerValues = z.infer<typeof officerSchema>;

export default function AuthPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const [signupType, setSignupType] = useState<SignupType>("citizen");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [loading, user, navigate, from]);

  const signupSchema = useMemo(
    () => (signupType === "citizen" ? citizenSchema : officerSchema),
    [signupType],
  );

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<CitizenValues | OfficerValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(signupSchema as any),
    defaultValues: { email: "", password: "" } as any,
  });

  const forgotForm = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onForgotPassword = async (values: z.infer<typeof forgotSchema>) => {
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/auth/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo });
      if (error) throw error;
      toast.success("Password reset email sent. Check your inbox.");
      setForgotOpen(false);
      forgotForm.reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async (values: LoginValues) => {
    setBusy(true);
    try {
      const { email, password } = values;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const onSignup = async (values: CitizenValues | OfficerValues) => {
    setBusy(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;

      // If your Supabase project is set to auto-confirm emails, user/session may be available immediately.
      // We still create profile/role records defensively.
      const userId = data.user?.id;
      if (userId) {
        const role = signupType === "citizen" ? "citizen" : "officer";

        // profiles table (NO role column; roles must live in user_roles)
        if (signupType === "citizen") {
          const v = values as CitizenValues;
          await supabase.from("profiles").upsert({
            id: userId,
            email: v.email,
            phone: v.phone ?? null,
            location: v.location,
            tin_number: v.tin_number,
          });
        } else {
          const v = values as OfficerValues;
          const office_type: OfficeType = signupType === "tax_officer" ? "tax" : "customs";
          await supabase.from("profiles").upsert({
            id: userId,
            email: v.email,
            officer_id: v.officer_id,
            office_type,
            office_location: v.office_location,
          });
        }

        // user_roles table
        await supabase.from("user_roles").insert({ user_id: userId, role });
      }

      // If emails are auto-confirmed, sign in immediately and go to dashboard.
      // Otherwise, user may need to confirm email first.
      if (data.session?.user) {
        toast.success("Account created");
        navigate(from, { replace: true });
      } else {
        const signIn = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (!signIn.error) {
          toast.success("Account created");
          navigate(from, { replace: true });
        } else {
          toast.success("Account created. Please sign in.");
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-90" style={{ background: "var(--gradient-primary)" }} aria-hidden="true" />
      <div className="absolute inset-0 bg-background/75" aria-hidden="true" />

      <div className="container relative py-12">
        <div className="mx-auto max-w-xl">
          <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">{t("auth.title")}</CardTitle>
            <CardDescription>{t("auth.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                  <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form className="space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
                  <div className="space-y-2">
                    <Label htmlFor="login_email">{t("auth.email")}</Label>
                    <Input id="login_email" autoComplete="email" {...loginForm.register("email")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login_password">{t("auth.password")}</Label>
                    <Input id="login_password" type="password" autoComplete="current-password" {...loginForm.register("password")} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? t("auth.signin_busy") : t("auth.signin")}
                  </Button>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-sm"
                      onClick={() => setForgotOpen(true)}
                      disabled={busy}
                    >
                      Forgot password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <div className="mb-4 grid gap-2">
                  <Label>Account type</Label>
                  <Select value={signupType} onValueChange={(v) => setSignupType(v as SignupType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      <SelectItem value="citizen">{t("auth.citizen")}</SelectItem>
                      <SelectItem value="tax_officer">Tax Officer</SelectItem>
                      <SelectItem value="customs_officer">Customs Officer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <form className="space-y-4" onSubmit={signupForm.handleSubmit(onSignup as any)}>
                  <div className="space-y-2">
                    <Label htmlFor="signup_email">{t("auth.email")}</Label>
                    <Input id="signup_email" autoComplete="email" {...signupForm.register("email" as any)} />
                  </div>

                  {signupType === "citizen" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="citizen_phone">{t("auth.phone_opt")}</Label>
                        <Input id="citizen_phone" autoComplete="tel" {...signupForm.register("phone" as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizen_location">{t("auth.location")}</Label>
                        <Input id="citizen_location" {...signupForm.register("location" as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizen_tin">{t("auth.tin")}</Label>
                        <Input id="citizen_tin" {...signupForm.register("tin_number" as any)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="officer_id">{t("auth.officer_id")}</Label>
                        <Input id="officer_id" {...signupForm.register("officer_id" as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="office_location">{t("auth.office_location")}</Label>
                        <Input id="office_location" {...signupForm.register("office_location" as any)} />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup_password">{t("auth.password")}</Label>
                    <Input id="signup_password" type="password" autoComplete="new-password" {...signupForm.register("password" as any)} />
                  </div>

                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? t("auth.create_busy") : t("auth.create")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset your password</DialogTitle>
                  <DialogDescription>
                    Enter your email and we’ll send you a password reset link.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={forgotForm.handleSubmit(onForgotPassword)}>
                  <div className="space-y-2">
                    <Label htmlFor="forgot_email">Email</Label>
                    <Input id="forgot_email" autoComplete="email" {...forgotForm.register("email")} />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} disabled={busy}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={busy}>
                      {busy ? "Sending…" : "Send reset link"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
       </div>
     </div>
    </section>
   );
}
