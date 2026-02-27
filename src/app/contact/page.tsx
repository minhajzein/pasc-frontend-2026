"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

export default function ContactPage() {
  const { t } = useLocale();
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("contact.title")}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground sm:text-base">
        {t("contact.intro")}
      </p>
      <div className="mt-8 space-y-6 rounded-lg border border-border bg-secondary/20 p-4 sm:mt-10 sm:p-6">
        <div>
          <h2 className="font-semibold text-foreground">{t("contact.email")}</h2>
          <p className="mt-1 break-all text-sm text-muted-foreground sm:text-base">
            <a
              href="mailto:pasfiesta@gmail.com"
              className="cursor-pointer underline hover:text-foreground"
            >
              pasfiesta2026@gmail.com
            </a>
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">
            {t("contact.forFestival")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {t("contact.forFestivalText")}
          </p>
        </div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="cursor-pointer underline hover:text-foreground">
          {t("contact.backToHome")}
        </Link>
      </p>
    </div>
  );
}
