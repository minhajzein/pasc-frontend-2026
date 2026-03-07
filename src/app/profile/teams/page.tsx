"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type TeamItem = {
  _id: string;
  league: string;
  teamName: string;
  teamLogo: string;
  status?: "pending" | "verified" | "rejected";
  franchiseOwner?: { fullName: string; photo?: string };
};

export default function MyTeamsPage() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiFetch<TeamItem[]>("/api/auth/me/teams")
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">{authLoading ? "Loading…" : "Redirecting…"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("auth.profile")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{t("auth.myTeams")}</h1>
      <p className="mt-1 text-muted-foreground">
        Teams where you are the franchise owner. You can update team details.
      </p>

      {loading && <p className="mt-6 text-muted-foreground">Loading teams…</p>}
      {!loading && teams.length === 0 && (
        <p className="mt-6 text-muted-foreground">You have no teams yet. Register from the festival page.</p>
      )}
      {!loading && teams.length > 0 && (
        <ul className="mt-6 space-y-4">
          {teams.map((team) => (
            <li
              key={team._id}
              className="flex items-center gap-4 rounded-lg border border-border bg-secondary/20 p-4"
            >
              {team.teamLogo ? (
                <Image
                  src={team.teamLogo}
                  alt={`${team.teamName} logo`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg border border-border bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{team.teamName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">{team.league.toUpperCase()}</p>
                  {team.status && (
                    <span
                      className={
                        team.status === "verified"
                          ? "rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
                          : team.status === "rejected"
                            ? "rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400"
                            : "rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                      }
                    >
                      {team.status === "verified" ? t("auth.statusVerified") : team.status === "rejected" ? t("auth.statusRejected") : t("auth.statusPending")}
                    </span>
                  )}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/profile/teams/${team.league}/${team._id}`}>Edit</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
