"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SPORTS_LEAGUES } from "@/lib/sports";
import { LEAGUE_I18N_KEYS } from "@/lib/i18n/translations";
import { useLocale } from "@/contexts/LocaleContext";

export default function AboutPage() {
  const { t } = useLocale();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("about.title")}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground sm:text-base">
        {t("about.intro")}
      </p>
      <h2 className="mt-8 text-lg font-semibold sm:mt-10 sm:text-xl">
        {t("about.festivalTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        {t("about.festivalText")}
      </p>
      <h2 className="mt-8 text-lg font-semibold sm:mt-10 sm:text-xl">
        {t("about.leaguesTitle")}
      </h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
        {SPORTS_LEAGUES.map((s) => (
          <li key={s.slug}>
            <span className="font-medium text-foreground">{s.league}</span> —{" "}
            {t(`leagues.${LEAGUE_I18N_KEYS[s.slug]}`)}
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <Button asChild>
          <Link href="/festival">{t("about.viewFestival")}</Link>
        </Button>
      </div>
    </div>
  );
}
