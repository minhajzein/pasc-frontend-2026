"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useLocale } from "@/contexts/LocaleContext";

const navLinks: { href: string; labelKey: string }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/festival", labelKey: "nav.festival" },
  { href: "/contact", labelKey: "nav.contact" },
];

const SCROLL_THRESHOLD = 10;
const HEADER_HEIGHT = 64;

export function Header() {
  const { locale, setLocale, t } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => setMounted(true), []);

  useMotionValueEvent(scrollY, "change", (latest: number) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;
    if (latest <= SCROLL_THRESHOLD) {
      setVisible(true);
      return;
    }
    if (Math.abs(diff) < SCROLL_THRESHOLD) return;
    setVisible(diff <= 0);
  });

  useEffect(() => {
    if (mobileMenuOpen) setVisible(true);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const mobileMenuPanel =
    mounted &&
    createPortal(
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            role="navigation"
            aria-label="Mobile menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col bg-background pt-20 md:hidden sm:pt-24"
            style={{ touchAction: "none" }}
          >
            <nav className="container mx-auto flex flex-1 flex-col justify-center gap-0 px-6 py-4 sm:px-8">
              {navLinks.map(({ href, labelKey }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: 0.08 + i * 0.04,
                    ease: "easeOut",
                  }}
                >
                  <Link
                    href={href}
                    className="block cursor-pointer rounded-lg px-4 py-4 text-lg font-medium text-muted-foreground hover:bg-accent hover:text-foreground active:bg-accent sm:py-5 sm:text-xl"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(labelKey)}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-8 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium ${
                    locale === "en"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("ml")}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium ${
                    locale === "ml"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  മലയാളം
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: visible ? 0 : -HEADER_HEIGHT }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed left-0 right-0 top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur will-change-transform"
      >
        <div className="container mx-auto max-w-7xl flex h-14 min-h-14 items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 cursor-pointer items-center gap-2 text-lg font-bold tracking-tight text-foreground sm:text-xl"
          >
            <Image
              src="/pasc-logo.png"
              alt="PASC"
              width={36}
              height={36}
              className="h-8 w-8 object-contain sm:h-9 sm:w-9"
            />
            <span>PASC</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(labelKey)}
              </Link>
            ))}
            <div className="ml-2 flex items-center gap-1 border-l border-border pl-4">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`cursor-pointer rounded px-2 py-1 text-sm font-medium transition-colors ${
                  locale === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("ml")}
                className={`cursor-pointer rounded px-2 py-1 text-sm font-medium transition-colors ${
                  locale === "ml"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Malayalam"
              >
                ML
              </button>
            </div>
          </nav>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background md:hidden"
            style={{ touchAction: "manipulation" }}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </motion.header>

      {mobileMenuPanel}
    </>
  );
}
