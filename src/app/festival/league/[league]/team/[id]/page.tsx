"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { SPORTS_LEAGUES } from "@/lib/sports";
import { LEAGUE_I18N_KEYS } from "@/lib/i18n/translations";
import { apiFetch } from "@/lib/api";

const LEAGUE_SLUGS = ["ppl", "pcl", "pvl", "pbl"] as const;

type Player = { name: string; photo: string; position: string };
type SponsorDetails = { name: string; logo: string };

type TeamDetail = {
  _id: string;
  league: string;
  teamName: string;
  teamLogo: string;
  managerName: string;
  managerIsPlayer: boolean;
  managerPhoto: string;
  players: Player[];
  sponsorDetails: SponsorDetails;
  declarationAccepted: boolean;
  createdAt: string;
  updatedAt: string;
};

const POSITION_KEYS: Record<string, string> = {
  goalkeeper: "register.positionGoalkeeper",
  forward: "register.positionForward",
  defender: "register.positionDefender",
};

export default function TeamDetailPage() {
  const params = useParams();
  const leagueParam = typeof params.league === "string" ? params.league.toLowerCase() : "";
  const league = LEAGUE_SLUGS.includes(leagueParam as (typeof LEAGUE_SLUGS)[number])
    ? (leagueParam as (typeof LEAGUE_SLUGS)[number])
    : null;
  const teamId = typeof params.id === "string" ? params.id : "";

  const { t } = useLocale();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!league || !teamId) return;
    setLoading(true);
    setError("");
    apiFetch<TeamDetail>(`/api/leagues/${league}/teams/${teamId}`)
      .then(setTeam)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load team"))
      .finally(() => setLoading(false));
  }, [league, teamId]);

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

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">{error || "Team not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/festival/league/${league}`}>{t("festival.backToLeague")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href={`/festival/league/${league}`}
          className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("festival.backToLeague")}
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-secondary/20 p-6">
        <div className="flex flex-wrap items-center gap-4">
          {team.teamLogo ? (
            <img
              src={team.teamLogo}
              alt=""
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-lg border border-border bg-muted" />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{team.teamName}</h1>
            <p className="text-sm text-muted-foreground">
              {leagueInfo.league} — {t(`leagues.${LEAGUE_I18N_KEYS[leagueInfo.slug]}`)}
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">
            {league === "pbl" ? "Team owner" : t("register.managerName")}
          </h2>
          <div className="mt-2 flex items-center gap-3">
            {team.managerPhoto ? (
              <img
                src={team.managerPhoto}
                alt=""
                className="h-16 w-16 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg border border-border bg-muted" />
            )}
            <div>
              <p className="font-medium text-foreground">{team.managerName}</p>
              {team.managerIsPlayer && (
                <p className="text-xs text-muted-foreground">{t("register.managerIsPlayer")}</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">{t("register.players")}</h2>
          <ul className="mt-2 space-y-3">
            {team.players.map((player, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt=""
                    className="h-12 w-12 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg border border-border bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {POSITION_KEYS[player.position]
                      ? t(POSITION_KEYS[player.position])
                      : player.position}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {(team.sponsorDetails?.name || team.sponsorDetails?.logo) && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">
              {t("register.sponsorDetails")}
            </h2>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
              {team.sponsorDetails.logo ? (
                <img
                  src={team.sponsorDetails.logo}
                  alt=""
                  className="h-12 w-12 rounded border border-border object-contain bg-muted"
                />
              ) : null}
              {team.sponsorDetails.name && (
                <p className="font-medium text-foreground">{team.sponsorDetails.name}</p>
              )}
            </div>
          </section>
        )}
      </div>

      <Button asChild variant="outline" className="mt-6">
        <Link href={`/festival/league/${league}`}>{t("festival.backToLeague")}</Link>
      </Button>
    </div>
  );
}
