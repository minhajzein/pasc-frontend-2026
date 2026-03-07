"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { SPORTS_LEAGUES } from "@/lib/sports";
import { LEAGUE_I18N_KEYS } from "@/lib/i18n/translations";
import { apiFetch } from "@/lib/api";

const LEAGUE_SLUGS = ["ppl", "pcl", "pvl", "pbl"] as const;
const LEAGUES_WITH_PLAYERS = ["ppl", "pcl", "pvl"] as const;

type LeaguePlayer = {
  _id: string;
  fullName: string;
  photo: string;
  position: string;
};

function positionLabel(position: string, t: (key: string) => string): string {
  if (!position.trim()) return "—";
  const key = `register.position${position.charAt(0).toUpperCase()}${position.slice(1)}`;
  return t(key as "register.positionForward") || position;
}

export default function LeaguePlayersPage() {
  const params = useParams();
  const router = useRouter();
  const leagueParam = typeof params.league === "string" ? params.league.toLowerCase() : "";
  const league = LEAGUE_SLUGS.includes(leagueParam as (typeof LEAGUE_SLUGS)[number])
    ? (leagueParam as (typeof LEAGUE_SLUGS)[number])
    : null;

  const { t } = useLocale();
  const [players, setPlayers] = useState<LeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!league) return;
    if (!LEAGUES_WITH_PLAYERS.includes(league as (typeof LEAGUES_WITH_PLAYERS)[number])) {
      router.replace(`/festival/league/${league}`);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch<LeaguePlayer[]>(`/api/leagues/${league}/players`)
      .then(setPlayers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load players"))
      .finally(() => setLoading(false));
  }, [league, router]);

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
          href={`/festival/league/${league}`}
          className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("festival.backToLeague")}
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {leagueInfo.league} — {t(`leagues.${LEAGUE_I18N_KEYS[leagueInfo.slug]}`)}
      </h1>
      <p className="mt-1 text-muted-foreground">{t("festival.registeredPlayers")}</p>

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/festival/league/${league}`}>{t("festival.viewTeams")}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/festival/register/${league}`}>{t("register.registerTeam")}</Link>
        </Button>
      </div>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="mt-6 rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
      )}
      {!loading && !error && players.length === 0 && (
        <p className="mt-6 text-muted-foreground">{t("festival.noPlayersYet")}</p>
      )}
      {!loading && !error && players.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {players.map((player) => (
            <li
              key={player._id}
              className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3"
            >
              {player.photo ? (
                <Image
                  src={player.photo}
                  alt={player.fullName}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-full border border-border bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{player.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {positionLabel(player.position, t)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
