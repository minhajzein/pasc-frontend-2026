"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fileToBase64 } from "@/lib/fileToBase64";
import { apiFetch } from "@/lib/api";
import type { PlayerMe } from "@/contexts/AuthContext";

const PLAYER_LEAGUES = ["ppl", "pcl", "pvl"] as const;
type PlayerLeague = (typeof PLAYER_LEAGUES)[number];

function isValidLeague(slug: string | null): slug is PlayerLeague {
  return slug !== null && PLAYER_LEAGUES.includes(slug as PlayerLeague);
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={80}
      height={80}
      className="h-20 w-20 rounded-lg border border-border object-cover"
    />
  );
}

export default function RegisterPlayerPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className="rounded-lg border border-border bg-secondary/20 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mt-6 h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    }>
      <RegisterPlayerContent />
    </Suspense>
  );
}

function RegisterPlayerContent() {
  const { t } = useLocale();
  const { setAuthFromPlayerRegister } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueFromUrl = searchParams.get("league")?.toLowerCase() ?? null;
  const initialLeague = isValidLeague(leagueFromUrl) ? leagueFromUrl : null;

  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [photo, setPhoto] = useState("");
  const [aadhaarFront, setAadhaarFront] = useState("");
  const [aadhaarBack, setAadhaarBack] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<PlayerLeague | null>(initialLeague);
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When URL has ?league=, set it as selected (e.g. when sharing link)
  useEffect(() => {
    if (initialLeague && !selectedLeague) setSelectedLeague(initialLeague);
  }, [initialLeague, selectedLeague]);

  const handlePhoto = useCallback((file: File | null) => {
    if (!file) {
      setPhoto("");
      return;
    }
    fileToBase64(file).then(setPhoto).catch(() => setPhoto(""));
  }, []);
  const handleAadhaarFront = useCallback((file: File | null) => {
    if (!file) {
      setAadhaarFront("");
      return;
    }
    fileToBase64(file).then(setAadhaarFront).catch(() => setAadhaarFront(""));
  }, []);
  const handleAadhaarBack = useCallback((file: File | null) => {
    if (!file) {
      setAadhaarBack("");
      return;
    }
    fileToBase64(file).then(setAadhaarBack).catch(() => setAadhaarBack(""));
  }, []);
  const handlePaymentFile = useCallback((file: File | null) => {
    if (!file) {
      setPaymentScreenshot("");
      return;
    }
    fileToBase64(file).then(setPaymentScreenshot).catch(() => setPaymentScreenshot(""));
  }, []);

  const canSubmit =
    selectedLeague &&
    paymentScreenshot.trim().length > 0;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !fullName.trim() || !photo) {
      setError("Full name, email, and photo are required.");
      return;
    }
    if (!selectedLeague || !paymentScreenshot.trim()) {
      setError(
        initialLeague
          ? "Please add payment proof for this league."
          : t("auth.playerRegisterSelectOneAndPayment")
      );
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/send-player-register-otp", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: normalizedEmail,
          whatsApp: whatsApp.trim(),
          photo,
          aadhaarFront: aadhaarFront || undefined,
          aadhaarBack: aadhaarBack || undefined,
          dateOfBirth: dateOfBirth || undefined,
          leaguePayments: [
            { leagueSlug: selectedLeague, paymentScreenshot: paymentScreenshot.trim() },
          ],
        }),
      });
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
      const res = await apiFetch<{ token: string; player: PlayerMe }>(
        "/api/auth/verify-player-register",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );
      setAuthFromPlayerRegister(res.token, res.player);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-lg border border-border bg-secondary/20 p-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("auth.playerRegisterTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.playerRegisterSubtitle")}
        </p>

        {step === "form" ? (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pr-fullName">{t("auth.playerRegisterName")} *</Label>
              <Input
                id="pr-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-email">{t("auth.email")} *</Label>
              <Input
                id="pr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-whatsapp">{t("auth.playerRegisterWhatsApp")}</Label>
              <Input
                id="pr-whatsapp"
                type="tel"
                value={whatsApp}
                onChange={(e) => setWhatsApp(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.playerRegisterPhoto")} *</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  className="max-w-xs cursor-pointer text-sm file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                  onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
                />
                <ImagePreview src={photo} alt="Photo" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("register.aadhaarFront")}</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  className="max-w-xs cursor-pointer text-sm file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                  onChange={(e) => handleAadhaarFront(e.target.files?.[0] ?? null)}
                />
                <ImagePreview src={aadhaarFront} alt="Aadhaar front" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("register.aadhaarBack")}</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  className="max-w-xs cursor-pointer text-sm file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                  onChange={(e) => handleAadhaarBack(e.target.files?.[0] ?? null)}
                />
                <ImagePreview src={aadhaarBack} alt="Aadhaar back" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-dob">{t("register.dateOfBirth")}</Label>
              <Input
                id="pr-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("register.dateOfBirthHint")}</p>
            </div>
            <div className="space-y-3">
              <Label>{t("auth.playerRegisterSelectLeague")}</Label>
              {initialLeague ? (
                <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-medium uppercase text-foreground">
                  {initialLeague}
                </p>
              ) : (
                <Select
                  value={selectedLeague ?? ""}
                  onValueChange={(v) => setSelectedLeague(v ? (v as PlayerLeague) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auth.playerRegisterSelectLeague")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_LEAGUES.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {slug.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedLeague && (
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <Label className="text-xs text-muted-foreground">
                    {t("auth.playerRegisterPaymentProof")} ({selectedLeague.toUpperCase()}) *
                  </Label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
                      onChange={(e) => handlePaymentFile(e.target.files?.[0] ?? null)}
                    />
                    {paymentScreenshot && (
                      <ImagePreview
                        src={paymentScreenshot}
                        alt={t("auth.playerRegisterPaymentProof")}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            {error && (
              <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading || !canSubmit} className="w-full">
              {loading ? t("auth.sending") : "Send verification code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("auth.codeSentTo")} <strong>{email}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="pr-otp">{t("auth.enterCode")}</Label>
              <Input
                id="pr-otp"
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
              <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("form");
                  setError("");
                }}
                className="flex-1"
              >
                {t("auth.back")}
              </Button>
              <Button
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                className="flex-1"
              >
                {loading ? t("auth.verifying") : "Verify and complete"}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Login
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("auth.backToHome")}
        </Link>
      </p>
    </div>
  );
}
