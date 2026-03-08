"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { apiAdminFetch, getAdminToken } from "@/lib/api";

type PopulatedPlayer = {
  _id: string;
  fullName: string;
  email?: string;
  photo?: string;
  whatsApp?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  dateOfBirth?: string;
  status?: string;
  leagueRegistrations?: { league: { name?: string; slug?: string }; paymentScreenshot?: string; position?: string }[];
};

type TeamDetail = {
  _id: string;
  league: string;
  teamName: string;
  teamLogo: string;
  franchiseOwner: PopulatedPlayer;
  players: { player: PopulatedPlayer; position: string }[];
  sponsorDetails: { name: string; logo: string };
  registrationPaymentStatus: string;
  registrationPaymentScreenshot: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
};

function DocImage({ src, alt, label }: { src: string; alt: string; label: string }) {
  if (!src || src.trim() === "") return null;
  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
        <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 400px) 100vw, 400px" />
      </div>
    </div>
  );
}

export default function AdminTeamDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const league = typeof params.league === "string" ? params.league : "";
  const id = typeof params.id === "string" ? params.id : "";
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin");
      return;
    }
    if (!league || !id) return;
    apiAdminFetch<TeamDetail>(`/api/admin/leagues/${league}/teams/${id}`)
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [league, id, router]);

  const setStatus = async (status: "verified" | "rejected") => {
    if (!team) return;
    setActionLoading(status === "verified" ? "approve" : "reject");
    try {
      await apiAdminFetch(`/api/admin/leagues/${league}/teams/${team._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTeam((prev) => (prev ? { ...prev, status } : null));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Team not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/dashboard">{t("admin.backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  const statusClass =
    team.status === "verified"
      ? "bg-green-500/20 text-green-700 dark:text-green-400"
      : team.status === "rejected"
        ? "bg-red-500/20 text-red-700 dark:text-red-400"
        : "bg-amber-500/20 text-amber-700 dark:text-amber-400";

  const owner = team.franchiseOwner as PopulatedPlayer | null;
  const isPbl = team.league === "pbl";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("admin.backToDashboard")}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.teamDetails")}</h1>
          <p className="mt-1 text-muted-foreground">{team.teamName}</p>
          <p className="text-sm text-muted-foreground">{league.toUpperCase()}</p>
          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
            {team.status === "verified"
              ? t("admin.approved")
              : team.status === "rejected"
                ? t("admin.rejected")
                : t("auth.statusPending")}
          </span>
        </div>
        {team.status === "pending" && (
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
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t("admin.paymentProof")} — team registration</h2>
          <DocImage src={team.registrationPaymentScreenshot ?? ""} alt="Team registration payment" label="" />
          {team.registrationPaymentStatus && (
            <p className="mt-1 text-xs text-muted-foreground">Status: {team.registrationPaymentStatus}</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Team logo</h2>
          <DocImage src={team.teamLogo} alt={`${team.teamName} logo`} label="" />
        </section>

        {team.sponsorDetails && (team.sponsorDetails.name || team.sponsorDetails.logo) && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Sponsor</h2>
            <p className="text-sm text-muted-foreground">{team.sponsorDetails.name || "—"}</p>
            <DocImage src={team.sponsorDetails.logo ?? ""} alt="Sponsor logo" label="" />
          </section>
        )}

        {owner && !isPbl && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Franchise owner</h2>
            <p className="font-medium">{owner.fullName}</p>
            <p className="text-sm text-muted-foreground">{owner.email ?? ""}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <DocImage src={owner.photo ?? ""} alt={owner.fullName} label={t("admin.photo")} />
              <DocImage src={owner.aadhaarFront ?? ""} alt="Aadhaar front" label={t("admin.aadhaarFront")} />
              <DocImage src={owner.aadhaarBack ?? ""} alt="Aadhaar back" label={t("admin.aadhaarBack")} />
            </div>
          </section>
        )}

        {team.players && team.players.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              {isPbl ? "Team members (doubles)" : "Players"}
            </h2>
            <ul className="space-y-4">
              {team.players.map((item, idx) => {
                const p = item.player as PopulatedPlayer | null;
                if (!p) return <li key={idx}>—</li>;
                const isOwner = owner && String((p as { _id?: string })._id) === String((owner as { _id?: string })._id);
                return (
                  <li key={idx} className="rounded-md border border-border bg-muted/30 p-3">
                    {isPbl ? (
                      <>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {isOwner ? "Owner" : "Partner"}
                        </p>
                        <p className="font-medium text-foreground">{p.fullName}</p>
                        {p.email && <p className="text-sm text-muted-foreground">{p.email}</p>}
                        {p.whatsApp && <p className="text-xs text-muted-foreground">WhatsApp: {p.whatsApp}</p>}
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">Position: {item.position}</p>
                        {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                      </>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4">
                      <DocImage src={p.photo ?? ""} alt={p.fullName} label="" />
                      <DocImage src={p.aadhaarFront ?? ""} alt="Aadhaar front" label="" />
                      <DocImage src={p.aadhaarBack ?? ""} alt="Aadhaar back" label="" />
                    </div>
                    {(() => {
                      const regForThisLeague = p.leagueRegistrations?.find(
                        (r) => (r.league as { slug?: string })?.slug === team.league
                      );
                      const screenshot = regForThisLeague?.paymentScreenshot;
                      return screenshot ? (
                        <div className="mt-2">
                          <DocImage src={screenshot} alt="Player payment (this league)" label="Payment (this league)" />
                        </div>
                      ) : null;
                    })()}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
