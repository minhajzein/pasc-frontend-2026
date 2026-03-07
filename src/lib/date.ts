/**
 * Format an ISO date string or Date for display (date only, no time).
 * Uses Intl.DateTimeFormat for locale-aware output (e.g. "22 Jun 2000" in en, locale-appropriate in ml).
 */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string = "en"
): string {
  if (value == null || value === "") return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ml" ? "ml" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format an ISO date string or Date for display with date and time.
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string = "en"
): string {
  if (value == null || value === "") return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ml" ? "ml" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
