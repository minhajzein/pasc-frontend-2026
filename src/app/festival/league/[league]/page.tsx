"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { SPORTS_LEAGUES } from "@/lib/sports";
import { LEAGUE_I18N_KEYS } from "@/lib/i18n/translations";
import { apiFetch } from "@/lib/api";

const LEAGUE_SLUGS = ["ppl", "pcl", "pvl", "pbl"] as const;

type TeamListItem = {
  _id: string;
  teamName: string;
  teamLogo: string;
  franchiseOwner?: { fullName: string; photo?: string };
  createdAt: string;
};

export default function LeagueTeamsPage() {
  const params = useParams();
  const leagueParam = typeof params.league === "string" ? params.league.toLowerCase() : "";
  const league = LEAGUE_SLUGS.includes(leagueParam as (typeof LEAGUE_SLUGS)[number])
    ? (leagueParam as (typeof LEAGUE_SLUGS)[number])
    : null;

  const { t } = useLocale();
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!league) return;
    setLoading(true);
    setError("");
    apiFetch<TeamListItem[]>(`/api/leagues/${league}/teams`)
      .then(setTeams)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load teams"))
      .finally(() => setLoading(false));
  }, [league]);

  const leagueInfo = league ? SPORTS_LEAGUES.find((l) => l.league.toLowerCase() === league) : null;

  if (!league || !leagueInfo) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Invalid league.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/festival">{t("festival.backToFestival")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href="/festival"
          className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("festival.backToFestival")}
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {leagueInfo.league} — {t(`leagues.${LEAGUE_I18N_KEYS[leagueInfo.slug]}`)}
      </h1>
      <p className="mt-1 text-muted-foreground">{t("festival.registeredTeams")}</p>

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/festival/register/${league}`}>{t("register.registerTeam")}</Link>
        </Button>
      </div>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="mt-6 rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
      )}
      {!loading && !error && teams.length === 0 && (
        <p className="mt-6 text-muted-foreground">{t("festival.noTeamsYet")}</p>
      )}
      {!loading && !error && teams.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <li
              key={team._id}
              className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-4"
            >
              {team.teamLogo ? (
                <Image
                  src={team.teamLogo}
                  alt={`${team.teamName} logo`}
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-lg border border-border bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{team.teamName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {team.franchiseOwner?.fullName ?? ""}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`/festival/league/${league}/team/${team._id}`}>
                  {t("festival.viewDetails")}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
