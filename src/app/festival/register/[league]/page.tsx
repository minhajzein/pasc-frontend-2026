"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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

const LEAGUE_SLUGS = ["ppl", "pcl", "pvl", "pbl"] as const;

function ImagePreview({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (!src) return null;
  return (
    <div className={className}>
      <img src={src} alt={alt} className="h-20 w-20 rounded-lg border border-border object-cover" />
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

  const schema = league === "pbl" ? pblRegisterSchema : defaultRegisterSchema;
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultRegisterFormValues,
  });
  const { control, handleSubmit, setValue, watch } = form;

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
        const res = await apiFetch<{ pendingToken: string }>(
          `/api/leagues/${league}/teams/send-otp`,
          {
            method: "POST",
            body: JSON.stringify({
              teamName: d.teamName.trim(),
              teamLogo: d.teamLogoBase64,
              players: [
                { name: d.player1Name.trim(), photo: d.player1PhotoBase64 },
                { name: d.player2Name.trim(), photo: d.player2PhotoBase64 },
              ],
              ownerEmail: d.ownerEmail.trim().toLowerCase(),
              ownerPlayerIndex: d.ownerPlayerIndex,
              sponsorDetails: { name: (d.sponsorName ?? "").trim(), logo: d.sponsorLogoBase64 ?? "" },
              declarationAccepted: true,
            }),
          }
        );
        setPendingToken(res.pendingToken);
        setOtp("");
        setError("");
      } catch (err) {
        const message = err instanceof Error ? err.message : t("register.error");
        setError(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const d = data as DefaultRegisterValues;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch<{ pendingToken: string }>(
        `/api/leagues/${league}/teams/send-otp`,
        {
          method: "POST",
          body: JSON.stringify({
            teamName: d.teamName.trim(),
            teamLogo: d.teamLogoBase64,
            managerName: d.managerName.trim(),
            managerEmail: d.managerEmail.trim().toLowerCase(),
            managerWhatsApp: (d.managerWhatsApp ?? "").trim(),
            managerIsPlayer: d.managerIsPlayer,
            managerPhoto: d.managerPhotoBase64,
            players: [{ name: d.iconPlayerName.trim(), photo: d.iconPlayerPhotoBase64, position: d.iconPlayerPosition }],
            sponsorDetails: { name: (d.sponsorName ?? "").trim(), logo: d.sponsorLogoBase64 ?? "" },
            declarationAccepted: true,
          }),
        }
      );
      setPendingToken(res.pendingToken);
      setOtp("");
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("register.error");
      setError(message);
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
        <Button asChild className="mt-4">
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
            </div>
            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">{t("register.player2")}</h3>
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
        <FormField
          control={control}
          name="managerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.managerName")} *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="managerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.managerEmail")} *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g. manager@example.com" {...field} />
              </FormControl>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("register.managerEmailHint")}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="managerWhatsApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.managerWhatsApp")}</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="e.g. +91 9876543210" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="managerIsPlayer"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer font-normal">
                  {t("register.managerIsPlayer")}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="managerPhotoBase64"
          render={() => (
            <FormItem>
              <FormLabel>{t("register.managerPhoto")} *</FormLabel>
              <FormControl>
                <div className="flex flex-wrap items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null, "managerPhotoBase64")}
                  />
                  <ImagePreview src={watch("managerPhotoBase64") ?? ""} alt="Manager photo" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border border-border bg-secondary/20 p-4">
          <h3 className="mb-1 text-sm font-medium text-foreground">
            {t("register.iconPlayer")}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("register.iconPlayerHint")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="iconPlayerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">
                    {t("register.playerName")}
                  </FormLabel>
                  <FormControl>
                    <Input className="text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="iconPlayerPosition"
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
                      <SelectItem value="goalkeeper">{t("register.positionGoalkeeper")}</SelectItem>
                      <SelectItem value="forward">{t("register.positionForward")}</SelectItem>
                      <SelectItem value="defender">{t("register.positionDefender")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="iconPlayerPhotoBase64"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      {t("register.playerPhoto")}
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          className="max-w-xs cursor-pointer text-xs file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                          onChange={(e) => handleFile(e.target.files?.[0] ?? null, "iconPlayerPhotoBase64")}
                        />
                        <ImagePreview src={watch("iconPlayerPhotoBase64") ?? ""} alt="Icon player photo" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

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
          </>
        )}

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
