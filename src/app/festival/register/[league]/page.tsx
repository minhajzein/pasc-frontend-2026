"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SPORTS_LEAGUES } from "@/lib/sports";
import { LEAGUE_I18N_KEYS } from "@/lib/i18n/translations";
import { fileToBase64 } from "@/lib/fileToBase64";
import { apiFetch } from "@/lib/api";
import {
  defaultRegisterSchema,
  pblRegisterSchema,
  defaultRegisterFormValues,
  type RegisterFormValues,
  type DefaultRegisterValues,
  type PblRegisterValues,
} from "@/lib/registerSchema";
import { PlayerSelect, type PlayerListItem } from "@/components/PlayerSelect";

const LEAGUE_SLUGS = ["ppl", "pcl", "pvl", "pbl"] as const;
const REGISTER_EMAIL_KEY = "pasc-last-registered-email";

function ImagePreview({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (!src) return null;
  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        width={80}
        height={80}
        className="h-20 w-20 rounded-lg border border-border object-cover"
      />
    </div>
  );
}

function QRCodePlaceholder({ label, scanLabel }: { label: string; scanLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
      <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg bg-white">
        <Image
          src="/qr-code.jpeg"
          alt={label}
          fill
          className="object-contain"
          sizes="128px"
        />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{scanLabel}</p>
    </div>
  );
}

export default function RegisterTeamPage() {
  const params = useParams();
  const leagueParam = typeof params.league === "string" ? params.league.toLowerCase() : "";
  const league = LEAGUE_SLUGS.includes(leagueParam as (typeof LEAGUE_SLUGS)[number])
    ? (leagueParam as (typeof LEAGUE_SLUGS)[number])
    : null;

  const { t } = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [franchiseOwnerMode, setFranchiseOwnerMode] = useState<"select" | "new">("new");
  const [franchiseOwnerId, setFranchiseOwnerId] = useState<string | null>(null);
  const [selectedFranchiseOwner, setSelectedFranchiseOwner] = useState<PlayerListItem | null>(null);
  const [pblPlayer1Mode, setPblPlayer1Mode] = useState<"select" | "new">("new");
  const [pblPlayer2Mode, setPblPlayer2Mode] = useState<"select" | "new">("new");
  const [selectedPblPlayer1, setSelectedPblPlayer1] = useState<PlayerListItem | null>(null);
  const [selectedPblPlayer2, setSelectedPblPlayer2] = useState<PlayerListItem | null>(null);

  const schema = league === "pbl" ? pblRegisterSchema : defaultRegisterSchema;
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultRegisterFormValues,
  });
  const { control, handleSubmit, setValue, watch } = form;

  // Pre-fill email when registering for another league (same player)
  useEffect(() => {
    if (typeof window === "undefined" || !league) return;
    const saved = window.sessionStorage.getItem(REGISTER_EMAIL_KEY);
    if (saved) {
      if (league === "pbl") {
        setValue("ownerEmail", saved);
      } else {
        setValue("franchiseOwnerEmail", saved);
      }
    }
  }, [league, setValue]);

  // Reset position to the default for the current league when league changes (PPL/PCL/PVL only)
  const defaultPositionByLeague: Record<string, string> = {
    ppl: "forward",
    pcl: "batter",
    pvl: "setter",
  };
  useEffect(() => {
    if (!league || league === "pbl") return;
    const defaultPos = defaultPositionByLeague[league] ?? "forward";
    setValue("franchiseOwnerPosition", defaultPos as RegisterFormValues["franchiseOwnerPosition"]);
  }, [league, setValue]);

  const handleFile = useCallback(
    (file: File | null, field: keyof RegisterFormValues) => {
      if (!file) {
        setValue(field, "", { shouldValidate: true });
        return;
      }
      fileToBase64(file)
        .then((base64) => setValue(field, base64, { shouldValidate: true }))
        .catch(() => setValue(field, "", { shouldValidate: true }));
    },
    [setValue]
  );

  const onFormSubmit = async (data: RegisterFormValues) => {
    if (!league) return;
    setError("");
    const isPbl = league === "pbl";

    if (isPbl) {
      const d = data as PblRegisterValues;
      setSubmitting(true);
      try {
        const ownerIdx = d.ownerPlayerIndex;
        const p1 = selectedPblPlayer1
          ? { playerId: selectedPblPlayer1._id, name: selectedPblPlayer1.fullName, photo: selectedPblPlayer1.photo, email: undefined }
          : {
              playerId: undefined as string | undefined,
              name: d.player1Name.trim(),
              photo: d.player1PhotoBase64,
              email: (d.player1Email ?? "").trim() || undefined,
              whatsApp: (d.player1WhatsApp ?? "").trim() || undefined,
              aadhaarFront: (d.player1AadhaarFrontBase64 ?? "").trim() || undefined,
              aadhaarBack: (d.player1AadhaarBackBase64 ?? "").trim() || undefined,
              dateOfBirth: (d.player1DateOfBirth ?? "").trim() || undefined,
              paymentScreenshot: (d.player1PaymentScreenshotBase64 ?? "").trim() || undefined,
            };
        const p2 = selectedPblPlayer2
          ? { playerId: selectedPblPlayer2._id, name: selectedPblPlayer2.fullName, photo: selectedPblPlayer2.photo, email: undefined }
          : {
              playerId: undefined as string | undefined,
              name: d.player2Name.trim(),
              photo: d.player2PhotoBase64,
              email: (d.player2Email ?? "").trim() || undefined,
              whatsApp: (d.player2WhatsApp ?? "").trim() || undefined,
              aadhaarFront: (d.player2AadhaarFrontBase64 ?? "").trim() || undefined,
              aadhaarBack: (d.player2AadhaarBackBase64 ?? "").trim() || undefined,
              dateOfBirth: (d.player2DateOfBirth ?? "").trim() || undefined,
              paymentScreenshot: (d.player2PaymentScreenshotBase64 ?? "").trim() || undefined,
            };
        const ownerEmail =
          ownerIdx === 0 && selectedPblPlayer1
            ? selectedPblPlayer1.email
            : ownerIdx === 1 && selectedPblPlayer2
              ? selectedPblPlayer2.email
              : d.ownerEmail.trim().toLowerCase();
        const res = await apiFetch<{ pendingToken: string }>(
          `/api/leagues/${league}/teams/send-otp`,
          {
            method: "POST",
            body: JSON.stringify({
              teamName: d.teamName.trim(),
              teamLogo: d.teamLogoBase64,
              players: [p1, p2],
              ownerEmail,
              ownerPlayerIndex: d.ownerPlayerIndex,
              sponsorDetails: { name: (d.sponsorName ?? "").trim(), logo: d.sponsorLogoBase64 ?? "" },
              teamRegistrationPaymentScreenshot: (d as RegisterFormValues).teamRegistrationPaymentBase64 ?? "",
              declarationAccepted: true,
            }),
          }
        );
        setPendingToken(res.pendingToken);
        setOtp("");
        setError("");
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(REGISTER_EMAIL_KEY, ownerEmail);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t("register.error");
        setError(message);
        setPendingToken(null);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const d = data as DefaultRegisterValues;
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        teamName: d.teamName.trim(),
        teamLogo: d.teamLogoBase64,
        franchiseOwnerWhatsApp: (d.franchiseOwnerWhatsApp ?? "").trim(),
        franchiseOwnerPosition: d.franchiseOwnerPosition,
        franchiseOwnerAadhaarFront: d.franchiseOwnerAadhaarFrontBase64 ?? "",
        franchiseOwnerAadhaarBack: d.franchiseOwnerAadhaarBackBase64 ?? "",
        franchiseOwnerDateOfBirth: d.franchiseOwnerDateOfBirth || undefined,
        franchiseOwnerPaymentScreenshot: d.franchiseOwnerPaymentScreenshotBase64 ?? "",
        players: [
          {
            name: d.franchiseOwnerName.trim(),
            photo: d.franchiseOwnerPhotoBase64,
            position: d.franchiseOwnerPosition,
          },
        ],
        sponsorDetails: { name: (d.sponsorName ?? "").trim(), logo: d.sponsorLogoBase64 ?? "" },
        teamRegistrationPaymentScreenshot: d.teamRegistrationPaymentBase64 ?? "",
        declarationAccepted: true,
      };
      if (franchiseOwnerId && selectedFranchiseOwner) {
        body.franchiseOwnerId = franchiseOwnerId;
        body.franchiseOwnerName = selectedFranchiseOwner.fullName;
        body.franchiseOwnerEmail = selectedFranchiseOwner.email;
        body.franchiseOwnerPhoto = selectedFranchiseOwner.photo;
        (body.players as { name: string; photo: string; position: string }[])[0] = {
          name: selectedFranchiseOwner.fullName,
          photo: selectedFranchiseOwner.photo,
          position: d.franchiseOwnerPosition,
        };
        if (!selectedFranchiseOwner.hasPaidForLeague && (d.franchiseOwnerPaymentScreenshotBase64 ?? "").trim()) {
          (body as Record<string, unknown>).franchiseOwnerPaymentScreenshot = d.franchiseOwnerPaymentScreenshotBase64?.trim();
        }
      } else {
        body.franchiseOwnerName = d.franchiseOwnerName.trim();
        body.franchiseOwnerEmail = d.franchiseOwnerEmail.trim().toLowerCase();
        body.franchiseOwnerPhoto = d.franchiseOwnerPhotoBase64;
      }
      const res = await apiFetch<{ pendingToken: string }>(
        `/api/leagues/${league}/teams/send-otp`,
        { method: "POST", body: JSON.stringify(body) }
      );
      setPendingToken(res.pendingToken);
      setOtp("");
      setError("");
      if (typeof window !== "undefined") {
        const emailToSave = franchiseOwnerId && selectedFranchiseOwner
          ? selectedFranchiseOwner.email
          : d.franchiseOwnerEmail.trim().toLowerCase();
        window.sessionStorage.setItem(REGISTER_EMAIL_KEY, emailToSave);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("register.error");
      setError(message);
      setPendingToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!league || !pendingToken || otp.trim().length !== 6) {
      setError(t("register.invalidOtp"));
      return;
    }
    setVerifying(true);
    setError("");
    try {
      await apiFetch(`/api/leagues/${league}/teams/verify`, {
        method: "POST",
        body: JSON.stringify({ pendingToken, otp: otp.trim() }),
      });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("register.error");
      setError(message);
      setPendingToken(null); // go back to form so user can fix team name or owner
    } finally {
      setVerifying(false);
    }
  };

  const leagueInfo = league ? SPORTS_LEAGUES.find((l) => l.league.toLowerCase() === league) : null;

  if (!league || !leagueInfo) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-muted-foreground">Invalid league.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/festival">{t("register.backToFestival")}</Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-lg text-foreground">{t("register.success")}</p>
        <div className="mt-6 rounded-lg border border-border bg-secondary/20 p-4">
          <h3 className="text-sm font-semibold text-foreground">{t("register.registerForAnotherLeague")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("register.registerForAnotherLeagueHint")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEAGUE_SLUGS.map((slug) => (
              <Button key={slug} asChild variant="outline" size="sm">
                <Link href={`/festival/register/${slug}`}>{slug.toUpperCase()}</Link>
              </Button>
            ))}
          </div>
        </div>
        <Button asChild className="mt-6">
          <Link href="/festival">{t("register.backToFestival")}</Link>
        </Button>
      </div>
    );
  }

  if (pendingToken) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => { setPendingToken(null); setError(""); }}
            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("register.backToForm")}
          </button>
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t("register.enterOtp")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("register.otpSent")}
        </p>
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-input">{t("register.enterOtp")}</Label>
            <Input
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="max-w-[10rem] text-center text-lg tracking-widest"
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={verifying || otp.trim().length !== 6} className="w-full sm:w-auto">
            {verifying ? "Verifying…" : t("register.verifyAndComplete")}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6">
      <div className="mb-6">
        <Link href="/festival" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          ← {t("register.backToFestival")}
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("register.title")} — {leagueInfo.league}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {league === "pbl" ? t("register.badmintonHint") : t(`leagues.${LEAGUE_I18N_KEYS[leagueInfo.slug]}`)}
      </p>
      {league === "pbl" && (
        <p className="mt-1 text-sm text-muted-foreground">{t("register.pblDoublesFeeNote")}</p>
      )}

      <p className="mt-2 text-sm text-muted-foreground">{t("register.multipleLeaguesNote")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("register.oneTeamPerLeagueNote")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("register.teamNameUniquePerLeagueNote")}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-sm font-medium text-foreground">{t("register.selectLeague")}:</span>
        {LEAGUE_SLUGS.map((slug) => (
          <Button
            key={slug}
            type="button"
            variant={league === slug ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/festival/register/${slug}`}>{slug.toUpperCase()}</Link>
          </Button>
        ))}
      </div>

      <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-8 space-y-6">
        <FormField
          control={control}
          name="teamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.teamName")} *</FormLabel>
              <FormControl>
                <Input placeholder="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="teamLogoBase64"
          render={({ field: { value, onChange, ...rest } }) => (
            <FormItem>
              <FormLabel>{t("register.teamLogo")} *</FormLabel>
              <FormControl>
                <div className="flex flex-wrap items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null, "teamLogoBase64")}
                    {...rest}
                  />
                  <ImagePreview src={watch("teamLogoBase64") ?? ""} alt="Team logo" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {league === "pbl" ? (
          <>
            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">{t("register.player1")}</h3>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button type="button" variant={pblPlayer1Mode === "select" ? "default" : "outline"} size="sm" onClick={() => { setPblPlayer1Mode("select"); setSelectedPblPlayer1(null); }}>
                  {t("register.selectExistingPlayer")}
                </Button>
                <Button type="button" variant={pblPlayer1Mode === "new" ? "default" : "outline"} size="sm" onClick={() => { setPblPlayer1Mode("new"); setSelectedPblPlayer1(null); }}>
                  {t("register.createNewPlayer")}
                </Button>
              </div>
              {pblPlayer1Mode === "select" ? (
                selectedPblPlayer1 ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                    {selectedPblPlayer1.photo ? (
                      <Image src={selectedPblPlayer1.photo} alt={selectedPblPlayer1.fullName} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div>
                      <p className="font-medium">{selectedPblPlayer1.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedPblPlayer1.email}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPblPlayer1(null)}>Change</Button>
                  </div>
                ) : (
                  <PlayerSelect
                    onSelect={(p) => {
                      setSelectedPblPlayer1(p);
                      if (watch("ownerPlayerIndex") === 0) setValue("ownerEmail", p.email);
                      setValue("player1Name", p.fullName);
                      setValue("player1PhotoBase64", p.photo);
                    }}
                    onNew={() => setPblPlayer1Mode("new")}
                    searchPlaceholder={t("register.searchPlayersPlaceholder")}
                    newLabel={t("register.createNewPlayer")}
                    noResultsLabel={t("register.noPlayersFound")}
                  />
                )
              ) : (
              <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="player1Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.playerName")}</FormLabel>
                      <FormControl>
                        <Input className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="player1PhotoBase64"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.playerPhoto")}</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null, "player1PhotoBase64")}
                          />
                          <ImagePreview src={watch("player1PhotoBase64") ?? ""} alt="Player 1" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="player1Email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">{t("auth.email")} (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. player@example.com" className="text-sm" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("register.pblPlayerEmailHint")}</p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="player1WhatsApp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">{t("register.franchiseOwnerWhatsApp")}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g. +91 9876543210" className="text-sm" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("register.pblPlayerContactHint")}</p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="player1AadhaarFrontBase64"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.aadhaarFront")} *</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null, "player1AadhaarFrontBase64")}
                          />
                          <ImagePreview src={watch("player1AadhaarFrontBase64") ?? ""} alt={t("register.aadhaarFront")} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="player1AadhaarBackBase64"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.aadhaarBack")} *</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null, "player1AadhaarBackBase64")}
                          />
                          <ImagePreview src={watch("player1AadhaarBackBase64") ?? ""} alt={t("register.aadhaarBack")} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="player1DateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">{t("register.dateOfBirth")} *</FormLabel>
                    <FormControl>
                      <Input type="date" className="text-sm" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("register.dateOfBirthHint")}</p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="mt-2 flex cursor-pointer items-center gap-2">
                <FormField
                  control={control}
                  name="ownerPlayerIndex"
                  render={({ field }) => (
                    <>
                      <input
                        type="radio"
                        id="owner0"
                        checked={field.value === 0}
                        onChange={() => field.onChange(0)}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <Label htmlFor="owner0" className="cursor-pointer text-xs text-foreground">{t("register.ownerIs")}</Label>
                    </>
                  )}
                />
              </div>
              </>
              )}
            </div>
            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">{t("register.player2")}</h3>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button type="button" variant={pblPlayer2Mode === "select" ? "default" : "outline"} size="sm" onClick={() => { setPblPlayer2Mode("select"); setSelectedPblPlayer2(null); }}>
                  {t("register.selectExistingPlayer")}
                </Button>
                <Button type="button" variant={pblPlayer2Mode === "new" ? "default" : "outline"} size="sm" onClick={() => { setPblPlayer2Mode("new"); setSelectedPblPlayer2(null); }}>
                  {t("register.createNewPlayer")}
                </Button>
              </div>
              {pblPlayer2Mode === "select" ? (
                selectedPblPlayer2 ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                    {selectedPblPlayer2.photo ? (
                      <Image src={selectedPblPlayer2.photo} alt={selectedPblPlayer2.fullName} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div>
                      <p className="font-medium">{selectedPblPlayer2.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedPblPlayer2.email}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPblPlayer2(null)}>Change</Button>
                  </div>
                ) : (
                  <PlayerSelect
                    onSelect={(p) => {
                      setSelectedPblPlayer2(p);
                      if (watch("ownerPlayerIndex") === 1) setValue("ownerEmail", p.email);
                      setValue("player2Name", p.fullName);
                      setValue("player2PhotoBase64", p.photo);
                    }}
                    onNew={() => setPblPlayer2Mode("new")}
                    searchPlaceholder={t("register.searchPlayersPlaceholder")}
                    newLabel={t("register.createNewPlayer")}
                    noResultsLabel={t("register.noPlayersFound")}
                  />
                )
              ) : (
              <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="player2Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.playerName")}</FormLabel>
                      <FormControl>
                        <Input className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="player2PhotoBase64"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.playerPhoto")}</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null, "player2PhotoBase64")}
                          />
                          <ImagePreview src={watch("player2PhotoBase64") ?? ""} alt="Player 2" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="player2Email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">{t("auth.email")} (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. player@example.com" className="text-sm" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("register.pblPlayerEmailHint")}</p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="player2WhatsApp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">{t("register.franchiseOwnerWhatsApp")}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g. +91 9876543210" className="text-sm" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("register.pblPlayerContactHint")}</p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="player2AadhaarFrontBase64"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.aadhaarFront")} *</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null, "player2AadhaarFrontBase64")}
                          />
                          <ImagePreview src={watch("player2AadhaarFrontBase64") ?? ""} alt={t("register.aadhaarFront")} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="player2AadhaarBackBase64"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.aadhaarBack")} *</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null, "player2AadhaarBackBase64")}
                          />
                          <ImagePreview src={watch("player2AadhaarBackBase64") ?? ""} alt={t("register.aadhaarBack")} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="player2DateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">{t("register.dateOfBirth")} *</FormLabel>
                    <FormControl>
                      <Input type="date" className="text-sm" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("register.dateOfBirthHint")}</p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              </>
              )}
              <div className="mt-2 flex cursor-pointer items-center gap-2">
                <FormField
                  control={control}
                  name="ownerPlayerIndex"
                  render={({ field }) => (
                    <>
                      <input
                        type="radio"
                        id="owner1"
                        checked={field.value === 1}
                        onChange={() => field.onChange(1)}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <Label htmlFor="owner1" className="cursor-pointer text-xs text-foreground">{t("register.ownerIs")}</Label>
                    </>
                  )}
                />
              </div>
            </div>
            <FormField
              control={control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.ownerEmail")} *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. owner@example.com" {...field} />
                  </FormControl>
                  <p className="mt-1 text-xs text-muted-foreground">{t("register.ownerEmailHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">{t("register.teamRegistrationPayment")} *</h3>
              <p className="mb-3 text-xs text-muted-foreground">{t("register.teamRegistrationPaymentHintPbl")}</p>
              <div className="mb-4">
                <QRCodePlaceholder label={t("register.qrCodePlaceholderTeam")} scanLabel={t("register.scanToPay")} />
              </div>
              <FormField
                control={control}
                name="teamRegistrationPaymentBase64"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">{t("register.teamRegistrationPaymentScreenshot")}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                          onChange={(e) => handleFile(e.target.files?.[0] ?? null, "teamRegistrationPaymentBase64")}
                        />
                        <ImagePreview src={watch("teamRegistrationPaymentBase64") ?? ""} alt={t("register.teamRegistrationPayment")} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">{t("register.sponsorDetails")} <span className="font-normal text-muted-foreground">(optional)</span></h3>
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="sponsorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("register.sponsorName")}</FormLabel>
                      <FormControl>
                        <Input className="text-sm" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">{t("register.sponsorLogo")}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null, "sponsorLogoBase64")}
                      />
                      <ImagePreview src={watch("sponsorLogoBase64") ?? ""} alt="Sponsor logo" />
                    </div>
                  </FormControl>
                </FormItem>
              </div>
            </div>
          </>
        ) : (
          <>
        <div className="rounded-lg border border-border bg-secondary/20 p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            {t("register.franchiseOwner")}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("register.franchiseOwnerHint")}
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={franchiseOwnerMode === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFranchiseOwnerMode("select");
                setFranchiseOwnerId(null);
                setSelectedFranchiseOwner(null);
              }}
            >
              {t("register.selectExistingPlayer")}
            </Button>
            <Button
              type="button"
              variant={franchiseOwnerMode === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFranchiseOwnerMode("new");
                setFranchiseOwnerId(null);
                setSelectedFranchiseOwner(null);
              }}
            >
              {t("register.createNewPlayer")}
            </Button>
          </div>
          {franchiseOwnerMode === "select" ? (
            <>
              {selectedFranchiseOwner ? (
                <>
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                  {selectedFranchiseOwner.photo ? (
                    <Image
                      src={selectedFranchiseOwner.photo}
                      alt={selectedFranchiseOwner.fullName}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted" />
                  )}
                  <div>
                    <p className="font-medium">{selectedFranchiseOwner.fullName}</p>
                    <p className="text-sm text-muted-foreground">{selectedFranchiseOwner.email}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedFranchiseOwner(null); setFranchiseOwnerId(null); }}>
                    Change
                  </Button>
                </div>
                {league && (
                  <FormField
                    control={control}
                    name="franchiseOwnerPosition"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel className="text-xs text-muted-foreground">
                          {t("register.playerPosition")}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {league === "ppl" && (
                              <>
                                <SelectItem value="goalkeeper">{t("register.positionGoalkeeper")}</SelectItem>
                                <SelectItem value="defender">{t("register.positionDefender")}</SelectItem>
                                <SelectItem value="midfielder">{t("register.positionMidfielder")}</SelectItem>
                                <SelectItem value="forward">{t("register.positionForward")}</SelectItem>
                                <SelectItem value="winger">{t("register.positionWinger")}</SelectItem>
                              </>
                            )}
                            {league === "pcl" && (
                              <>
                                <SelectItem value="batter">{t("register.positionBatter")}</SelectItem>
                                <SelectItem value="bowler">{t("register.positionBowler")}</SelectItem>
                                <SelectItem value="allRounder">{t("register.positionAllRounder")}</SelectItem>
                                <SelectItem value="wicketKeeper">{t("register.positionWicketKeeper")}</SelectItem>
                              </>
                            )}
                            {league === "pvl" && (
                              <>
                                <SelectItem value="setter">{t("register.positionSetter")}</SelectItem>
                                <SelectItem value="outsideHitter">{t("register.positionOutsideHitter")}</SelectItem>
                                <SelectItem value="oppositeHitter">{t("register.positionOppositeHitter")}</SelectItem>
                                <SelectItem value="middleBlocker">{t("register.positionMiddleBlocker")}</SelectItem>
                                <SelectItem value="libero">{t("register.positionLibero")}</SelectItem>
                                <SelectItem value="defensiveSpecialist">
                                  {t("register.positionDefensiveSpecialist")}
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
                {selectedFranchiseOwner && !selectedFranchiseOwner.hasPaidForLeague && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground">{t("register.paymentScreenshotHintNonPbl")}</p>
                    <FormField
                      control={control}
                      name="franchiseOwnerPaymentScreenshotBase64"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <QRCodePlaceholder label={t("register.qrCodePlaceholderPlayer")} scanLabel={t("register.scanToPay")} />
                          </div>
                          <FormLabel className="text-xs text-muted-foreground">{t("register.paymentScreenshotLabelNonPbl")} *</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap items-center gap-3">
                              <Input
                                type="file"
                                accept="image/*"
                                className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                                onChange={(e) => handleFile(e.target.files?.[0] ?? null, "franchiseOwnerPaymentScreenshotBase64")}
                              />
                              <ImagePreview src={watch("franchiseOwnerPaymentScreenshotBase64") ?? ""} alt={t("register.paymentScreenshot")} className="max-h-24" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                </>
              ) : (
                <PlayerSelect
                  league={league}
                  onSelect={(player) => {
                    setSelectedFranchiseOwner(player);
                    setFranchiseOwnerId(player._id);
                    setValue("franchiseOwnerName", player.fullName);
                    setValue("franchiseOwnerEmail", player.email);
                    setValue("franchiseOwnerPhotoBase64", player.photo);
                    setValue("franchiseOwnerAadhaarFrontBase64", " ");
                    setValue("franchiseOwnerAadhaarBackBase64", " ");
                    setValue("franchiseOwnerDateOfBirth", "2000-01-01");
                    setValue("franchiseOwnerPaymentScreenshotBase64", player.hasPaidForLeague ? " " : "");
                    setValue("franchiseOwnerWhatsApp", player.whatsApp ?? "");
                    const defaultPos = defaultPositionByLeague[league ?? ""] ?? "forward";
                    setValue("franchiseOwnerPosition", (player.positionForLeague ?? defaultPos) as RegisterFormValues["franchiseOwnerPosition"]);
                  }}
                  onNew={() => setFranchiseOwnerMode("new")}
                  searchPlaceholder={t("register.searchPlayersPlaceholder")}
                  selectLabel={t("register.selectExistingPlayer")}
                  newLabel={t("register.createNewPlayer")}
                  noResultsLabel={t("register.noPlayersFound")}
                />
              )}
            </>
          ) : (
          <div className="space-y-4">
            <FormField
              control={control}
              name="franchiseOwnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.franchiseOwnerName")} *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.franchiseOwnerEmail")} *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. owner@example.com" {...field} />
                  </FormControl>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("register.franchiseOwnerEmailHint")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerWhatsApp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.franchiseOwnerWhatsApp")} *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g. +91 9876543210" {...field} />
                  </FormControl>
                  <p className="mt-1 text-xs text-muted-foreground">{t("register.franchiseOwnerContactHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">
                    {t("register.playerPosition")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {league === "ppl" && (
                        <>
                          <SelectItem value="goalkeeper">{t("register.positionGoalkeeper")}</SelectItem>
                          <SelectItem value="defender">{t("register.positionDefender")}</SelectItem>
                          <SelectItem value="midfielder">{t("register.positionMidfielder")}</SelectItem>
                          <SelectItem value="forward">{t("register.positionForward")}</SelectItem>
                          <SelectItem value="winger">{t("register.positionWinger")}</SelectItem>
                        </>
                      )}
                      {league === "pcl" && (
                        <>
                          <SelectItem value="batter">{t("register.positionBatter")}</SelectItem>
                          <SelectItem value="bowler">{t("register.positionBowler")}</SelectItem>
                          <SelectItem value="allRounder">{t("register.positionAllRounder")}</SelectItem>
                          <SelectItem value="wicketKeeper">{t("register.positionWicketKeeper")}</SelectItem>
                        </>
                      )}
                      {league === "pvl" && (
                        <>
                          <SelectItem value="setter">{t("register.positionSetter")}</SelectItem>
                          <SelectItem value="outsideHitter">{t("register.positionOutsideHitter")}</SelectItem>
                          <SelectItem value="oppositeHitter">{t("register.positionOppositeHitter")}</SelectItem>
                          <SelectItem value="middleBlocker">{t("register.positionMiddleBlocker")}</SelectItem>
                          <SelectItem value="libero">{t("register.positionLibero")}</SelectItem>
                          <SelectItem value="defensiveSpecialist">
                            {t("register.positionDefensiveSpecialist")}
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerPhotoBase64"
              render={() => (
                <FormItem>
                  <FormLabel>{t("register.franchiseOwnerPhoto")} *</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null, "franchiseOwnerPhotoBase64")}
                      />
                      <ImagePreview src={watch("franchiseOwnerPhotoBase64") ?? ""} alt={t("register.franchiseOwnerPhoto")} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerAadhaarFrontBase64"
              render={() => (
                <FormItem>
                  <FormLabel>{t("register.aadhaarFront")} *</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null, "franchiseOwnerAadhaarFrontBase64")}
                      />
                      <ImagePreview src={watch("franchiseOwnerAadhaarFrontBase64") ?? ""} alt={t("register.aadhaarFront")} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerAadhaarBackBase64"
              render={() => (
                <FormItem>
                  <FormLabel>{t("register.aadhaarBack")} *</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null, "franchiseOwnerAadhaarBackBase64")}
                      />
                      <ImagePreview src={watch("franchiseOwnerAadhaarBackBase64") ?? ""} alt={t("register.aadhaarBack")} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerDateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.dateOfBirth")} *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <p className="mt-1 text-xs text-muted-foreground">{t("register.dateOfBirthHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="franchiseOwnerPaymentScreenshotBase64"
              render={() => (
                <FormItem>
                  <div className="mb-3">
                    <QRCodePlaceholder label={t("register.qrCodePlaceholderPlayer")} scanLabel={t("register.scanToPay")} />
                  </div>
                  <FormLabel>{t("register.paymentScreenshotLabelNonPbl")} *</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null, "franchiseOwnerPaymentScreenshotBase64")}
                      />
                      <ImagePreview src={watch("franchiseOwnerPaymentScreenshotBase64") ?? ""} alt={t("register.paymentScreenshot")} className="max-h-24" />
                    </div>
                  </FormControl>
                  <p className="mt-1 text-xs text-muted-foreground">{t("register.paymentScreenshotHintNonPbl")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        </div>
        </>
        )}

        {league !== "pbl" && (
        <div className="rounded-lg border border-border bg-secondary/20 p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">{t("register.teamRegistrationPayment")} *</h3>
          <p className="mb-3 text-xs text-muted-foreground">{t("register.teamRegistrationPaymentHintNonPbl")}</p>
          <div className="mb-4">
            <QRCodePlaceholder label={t("register.qrCodePlaceholderTeam")} scanLabel={t("register.scanToPay")} />
          </div>
          <FormField
            control={control}
            name="teamRegistrationPaymentBase64"
            render={() => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t("register.teamRegistrationPaymentScreenshot")}</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null, "teamRegistrationPaymentBase64")}
                    />
                    <ImagePreview src={watch("teamRegistrationPaymentBase64") ?? ""} alt={t("register.teamRegistrationPayment")} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        )}

        <div className="rounded-lg border border-border bg-secondary/20 p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            {t("register.sponsorDetails")}
          </h3>
          <div className="space-y-4">
            <FormField
              control={control}
              name="sponsorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">
                    {t("register.sponsorName")}
                  </FormLabel>
                  <FormControl>
                    <Input className="text-sm" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                {t("register.sponsorLogo")}
              </FormLabel>
              <FormControl>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null, "sponsorLogoBase64")}
                  />
                  <ImagePreview src={watch("sponsorLogoBase64") ?? ""} alt="Sponsor logo" />
                </div>
              </FormControl>
            </FormItem>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/20 p-4">
          <FormField
            control={control}
            name="declarationAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer font-normal text-sm">
                    {t("register.declaration")}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Submitting…" : t("register.submit")}
        </Button>
      </form>
      </Form>
    </div>
  );
}
