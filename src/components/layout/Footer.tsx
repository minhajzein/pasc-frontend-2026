"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

const footerLinks: { href: string; labelKey: string }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/festival", labelKey: "nav.festival" },
  { href: "/contact", labelKey: "nav.contact" },
];

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("footer.copyright")}
          </p>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {footerLinks.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
