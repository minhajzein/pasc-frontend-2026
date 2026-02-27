"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SPORTS_LEAGUES } from "@/lib/sports";
import { LEAGUE_I18N_KEYS } from "@/lib/i18n/translations";
import { useLocale } from "@/contexts/LocaleContext";

export default function HomePage() {
  const { t } = useLocale();
  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-background to-secondary/30 px-4 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            PASFIESTA
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg md:text-xl">
            {t("home.heroSubtitle")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t("home.heroTagline")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 sm:gap-4">
            <Button asChild size="lg">
              <Link href="/festival">{t("home.festivalDetails")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">{t("nav.about")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-xl font-semibold sm:mb-10 sm:text-2xl">
            {t("home.leaguesTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {SPORTS_LEAGUES.map((league) => (
              <div
                key={league.slug}
                className="rounded-lg border border-border bg-secondary/50 p-4 text-center transition-colors hover:bg-accent/50 sm:p-6"
              >
                <h3 className="font-semibold text-foreground">{league.league}</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {t(`leagues.${LEAGUE_I18N_KEYS[league.slug]}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/20 px-4 py-10 sm:py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-semibold sm:mb-4 sm:text-2xl">
            {t("home.aboutTitle")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-0 sm:text-base">
            {t("home.aboutText")}
          </p>
          <Button asChild variant="outline" className="mt-4 sm:mt-6">
            <Link href="/about">{t("home.learnMore")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
