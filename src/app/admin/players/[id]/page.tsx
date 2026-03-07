"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { apiAdminFetch, getAdminToken } from "@/lib/api";

type LeagueReg = {
  league: { name: string; slug: string };
  paymentStatus: string;
  paymentScreenshot: string;
  eligible?: boolean;
  position?: string;
};

type PlayerDetail = {
  _id: string;
  fullName: string;
  email: string;
  whatsApp: string;
  photo: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  dateOfBirth?: string;
  leagueRegistrations: LeagueReg[];
  status: "pending" | "verified" | "rejected";
  createdAt: string;
};

function DocImage({ src, alt, label }: { src: string; alt: string; label: string }) {
  if (!src || src.trim() === "") return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
        <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 400px) 100vw, 400px" />
      </div>
    </div>
  );
}

export default function AdminPlayerDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [eligibleLoading, setEligibleLoading] = useState<string | null>(null); // league slug

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin");
      return;
    }
    if (!id) return;
    apiAdminFetch<PlayerDetail>(`/api/admin/players/${id}`)
      .then(setPlayer)
      .catch(() => setPlayer(null))
      .finally(() => setLoading(false));
  }, [id, router]);

  const setStatus = async (status: "verified" | "rejected") => {
    if (!player) return;
    setActionLoading(status === "verified" ? "approve" : "reject");
    try {
      await apiAdminFetch(`/api/admin/players/${player._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setPlayer((p) => (p ? { ...p, status } : null));
    } finally {
      setActionLoading(null);
    }
  };

  const setEligible = async (leagueSlug: string, eligible: boolean) => {
    if (!player) return;
    setEligibleLoading(leagueSlug);
    try {
      const updated = await apiAdminFetch<PlayerDetail>(
        `/api/admin/players/${player._id}/league-registration`,
        {
          method: "PATCH",
          body: JSON.stringify({ leagueSlug, eligible }),
        }
      );
      setPlayer(updated);
    } finally {
      setEligibleLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Player not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/dashboard">{t("admin.backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  const statusClass =
    player.status === "verified"
      ? "bg-green-500/20 text-green-700 dark:text-green-400"
      : player.status === "rejected"
        ? "bg-red-500/20 text-red-700 dark:text-red-400"
        : "bg-amber-500/20 text-amber-700 dark:text-amber-400";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("admin.backToDashboard")}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.playerDetails")}</h1>
          <p className="mt-1 text-muted-foreground">{player.fullName}</p>
          <p className="text-sm text-muted-foreground">{player.email}</p>
          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
            {player.status === "verified"
              ? t("admin.approved")
              : player.status === "rejected"
                ? t("admin.rejected")
                : t("auth.statusPending")}
          </span>
        </div>
        {player.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!!actionLoading}
              onClick={() => setStatus("rejected")}
              variant="destructive"
            >
              {actionLoading === "reject" ? "…" : t("admin.reject")}
            </Button>
            <Button
              size="sm"
              disabled={!!actionLoading}
              onClick={() => setStatus("verified")}
            >
              {actionLoading === "approve" ? "…" : t("admin.approve")}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6 rounded-lg border border-border bg-secondary/20 p-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t("admin.photo")}</h2>
          <DocImage src={player.photo} alt={player.fullName} label="" />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t("admin.documents")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <DocImage
              src={player.aadhaarFront ?? ""}
              alt="Aadhaar front"
              label={t("admin.aadhaarFront")}
            />
            <DocImage
              src={player.aadhaarBack ?? ""}
              alt="Aadhaar back"
              label={t("admin.aadhaarBack")}
            />
          </div>
          {player.dateOfBirth && (
            <p className="mt-2 text-sm text-muted-foreground">
              Date of birth: {typeof player.dateOfBirth === "string" ? player.dateOfBirth : new Date(player.dateOfBirth).toISOString().slice(0, 10)}
            </p>
          )}
          {player.whatsApp && (
            <p className="mt-1 text-sm text-muted-foreground">WhatsApp: {player.whatsApp}</p>
          )}
        </section>

        {player.leagueRegistrations && player.leagueRegistrations.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t("admin.paymentProof")}</h2>
            <div className="space-y-4">
              {player.leagueRegistrations.map((reg, idx) => {
                const league = reg.league as { name?: string; slug?: string } | undefined;
                const leagueName = league?.name ?? league?.slug ?? "League";
                const leagueSlug = league?.slug ?? "";
                const isEligible = reg.eligible === true;
                const updating = eligibleLoading === leagueSlug;
                return (
                  <div key={idx} className="rounded-md border border-border bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {leagueName} — {reg.paymentStatus}
                        {reg.position ? ` · ${reg.position}` : ""}
                        {reg.eligible !== undefined && (
                          <span className={isEligible ? " text-green-600 dark:text-green-400" : " text-muted-foreground"}>
                            {" "}
                            · {isEligible ? t("admin.eligible") : t("admin.notEligible")}
                          </span>
                        )}
                      </p>
                      {leagueSlug && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!!updating}
                          onClick={() => setEligible(leagueSlug, !isEligible)}
                        >
                          {updating ? "…" : isEligible ? t("admin.setNotEligible") : t("admin.setEligible")}
                        </Button>
                      )}
                    </div>
                    <DocImage
                      src={reg.paymentScreenshot ?? ""}
                      alt={`Payment ${idx + 1}`}
                      label=""
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
