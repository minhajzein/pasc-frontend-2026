"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SPORTS_LEAGUES } from "@/lib/sports";
import { LEAGUE_I18N_KEYS } from "@/lib/i18n/translations";
import { useLocale } from "@/contexts/LocaleContext";

export default function FestivalPage() {
  const { t } = useLocale();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">PASFIESTA</h1>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">
        {t("festival.tagline")}
      </p>

      <section className="mt-10 sm:mt-12">
        <h2 className="text-lg font-semibold sm:text-xl">
          {t("festival.leaguesTitle")}
        </h2>
        <ul className="mt-4 space-y-4">
          {SPORTS_LEAGUES.map((league) => (
            <li
              key={league.slug}
              className="rounded-lg border border-border bg-secondary/30 p-4"
            >
              <h3 className="font-medium text-foreground">
                {league.league} — {t(`leagues.${LEAGUE_I18N_KEYS[league.slug]}`)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`leagues.${LEAGUE_I18N_KEYS[league.slug]}Desc`)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/festival/league/${league.league.toLowerCase()}`}>
                    {t("festival.viewTeams")}
                  </Link>
                </Button>
                {league.league.toLowerCase() !== "pbl" && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/festival/league/${league.league.toLowerCase()}/players`}>
                      {t("festival.viewPlayers")}
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/festival/register/${league.league.toLowerCase()}`}>
                    {t("register.registerTeam")}
                  </Link>
                </Button>
                {league.league.toLowerCase() !== "pbl" && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/register/player?league=${league.league.toLowerCase()}`}>
                      {t("auth.registerPlayer")}
                    </Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-lg border border-border bg-secondary/20 p-4 sm:mt-12 sm:p-6">
        <h2 className="text-lg font-semibold sm:text-xl">
          {t("festival.joinTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {t("festival.joinText")}
        </p>
        <Button asChild className="mt-4">
          <Link href="/contact">{t("festival.contactUs")}</Link>
        </Button>
      </section>
    </div>
  );
}
