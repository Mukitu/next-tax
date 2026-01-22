import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/browserClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z
  .object({
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [busy, setBusy] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setHasSession(Boolean(data.session));
        setReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setHasSession(false);
        setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (values: Values) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update password");
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
              <CardTitle className="text-2xl tracking-tight">Set a new password</CardTitle>
              <CardDescription>
                {ready
                  ? hasSession
                    ? "Choose a new password for your account."
                    : "This reset link is invalid or expired. Please request a new one."
                  : "Loading…"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {ready && !hasSession ? (
                <Button onClick={() => navigate("/auth", { replace: true })}>
                  Back to sign in
                </Button>
              ) : (
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      {...form.register("confirmPassword")}
                    />
                    {form.formState.errors.confirmPassword?.message ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    ) : null}
                  </div>

                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Updating…" : "Update password"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
