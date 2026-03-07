"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { t } = useLocale();
  const { loginWithOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      await loginWithOtp(email.trim());
      setStep("otp");
      setOtp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp.trim());
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-lg border border-border bg-secondary/20 p-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("auth.loginTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">{t("auth.email")}</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("auth.sending") : t("auth.sendCode")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{t("auth.codeSentTo")} <strong>{email}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="login-otp">{t("auth.enterCode")}</Label>
              <Input
                id="login-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-widest"
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep("email"); setError(""); }}
                className="flex-1"
              >
                {t("auth.back")}
              </Button>
              <Button type="submit" disabled={loading || otp.trim().length !== 6} className="flex-1">
                {loading ? t("auth.verifying") : t("auth.verifyAndLogin")}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/festival" className="underline hover:text-foreground">
            {t("auth.registerTeam")}
          </Link>
          {" · "}
          <Link href="/register/player" className="underline hover:text-foreground">
            {t("auth.registerPlayer")}
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("auth.backToHome")}
        </Link>
      </p>
    </div>
  );
}
