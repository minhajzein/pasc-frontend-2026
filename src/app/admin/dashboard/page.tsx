"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { apiAdminFetch, getAdminToken } from "@/lib/api";

type PendingPlayer = {
  _id: string;
  fullName: string;
  email: string;
  createdAt: string;
  status: string;
};

type PendingTeam = {
  _id: string;
  league: string;
  teamName: string;
  franchiseOwner?: { fullName: string; email: string };
  createdAt: string;
  status: string;
};

const LEAGUES = ["ppl", "pcl", "pvl", "pbl"] as const;

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [players, setPlayers] = useState<PendingPlayer[]>([]);
  const [teamsByLeague, setTeamsByLeague] = useState<Record<string, PendingTeam[]>>({});
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvingTeam, setApprovingTeam] = useState<string | null>(null);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin");
      return;
    }
    Promise.all([
      apiAdminFetch<PendingPlayer[]>("/api/admin/players/pending"),
      ...LEAGUES.map((league) =>
        apiAdminFetch<PendingTeam[]>(`/api/admin/leagues/${league}/teams/pending`).then(
          (teams) => ({ league, teams })
        )
      ),
    ])
      .then(([playersRes, ...leagueResults]) => {
        setPlayers(playersRes);
        const map: Record<string, PendingTeam[]> = {};
        for (const { league, teams } of leagueResults) {
          map[league] = teams;
        }
        setTeamsByLeague(map);
      })
      .catch(() => {
        setPlayers([]);
        setTeamsByLeague({});
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleApprovePlayer = async (id: string) => {
    setApprovingId(id);
    try {
      await apiAdminFetch(`/api/admin/players/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "verified" }),
      });
      setPlayers((prev) => prev.filter((p) => p._id !== id));
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveTeam = async (league: string, id: string) => {
    setApprovingTeam(id);
    try {
      await apiAdminFetch(`/api/admin/leagues/${league}/teams/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "verified" }),
      });
      setTeamsByLeague((prev) => ({
        ...prev,
        [league]: (prev[league] || []).filter((t) => t._id !== id),
      }));
    } finally {
      setApprovingTeam(null);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("pasc-admin-token");
    }
    router.replace("/admin");
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.dashboard")}</h1>
        <Button variant="outline" size="sm" onClick={logout}>
          {t("admin.logout")}
        </Button>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">{t("admin.pendingPlayers")}</h2>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.noPendingPlayers")}</p>
        ) : (
          <ul className="space-y-3">
            {players.map((p) => (
              <li
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 p-4"
              >
                <div>
                  <p className="font-medium">{p.fullName}</p>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/players/${p._id}`}>{t("admin.viewDetails")}</Link>
                  </Button>
                  <Button
                    size="sm"
                    disabled={approvingId === p._id}
                    onClick={() => handleApprovePlayer(p._id)}
                  >
                    {approvingId === p._id ? "…" : t("admin.approve")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {LEAGUES.map((league) => {
        const leagueTeams = teamsByLeague[league] ?? [];
        return (
        <section key={league} className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">
            {t("admin.pendingTeams")} — {league.toUpperCase()}
          </h2>
          {leagueTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.noPendingTeams")}</p>
          ) : (
            <ul className="space-y-3">
              {leagueTeams.map((team) => (
                <li
                  key={team._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 p-4"
                >
                  <div>
                    <p className="font-medium">{team.teamName}</p>
                    {team.franchiseOwner && (
                      <p className="text-sm text-muted-foreground">
                        {team.franchiseOwner.fullName} — {team.franchiseOwner.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/teams/${league}/${team._id}`}>{t("admin.viewDetails")}</Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled={approvingTeam === team._id}
                      onClick={() => handleApproveTeam(league, team._id)}
                    >
                      {approvingTeam === team._id ? "…" : t("admin.approve")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        );
      })}

      <p className="mt-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
