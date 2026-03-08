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

function statusBadge(status: string) {
  const cls =
    status === "verified"
      ? "bg-green-500/20 text-green-700 dark:text-green-400"
      : status === "rejected"
        ? "bg-red-500/20 text-red-700 dark:text-red-400"
        : "bg-amber-500/20 text-amber-700 dark:text-amber-400";
  const label =
    status === "verified"
      ? "Verified"
      : status === "rejected"
        ? "Rejected"
        : "Pending";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

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
      apiAdminFetch<PendingPlayer[]>("/api/admin/players"),
      ...LEAGUES.map((league) =>
        apiAdminFetch<PendingTeam[]>(`/api/admin/leagues/${league}/teams`).then(
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

  const handleRejectPlayer = async (id: string) => {
    setApprovingId(id);
    try {
      await apiAdminFetch(`/api/admin/players/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      });
      setPlayers((prev) => prev.map((p) => (p._id === id ? { ...p, status: "rejected" } : p)));
    } finally {
      setApprovingId(null);
    }
  };

  const handleApprovePlayer = async (id: string) => {
    setApprovingId(id);
    try {
      await apiAdminFetch(`/api/admin/players/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "verified" }),
      });
      setPlayers((prev) => prev.map((p) => (p._id === id ? { ...p, status: "verified" } : p)));
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectTeam = async (league: string, id: string) => {
    setApprovingTeam(id);
    try {
      await apiAdminFetch(`/api/admin/leagues/${league}/teams/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      });
      setTeamsByLeague((prev) => ({
        ...prev,
        [league]: (prev[league] || []).map((t) => (t._id === id ? { ...t, status: "rejected" } : t)),
      }));
    } finally {
      setApprovingTeam(null);
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
        [league]: (prev[league] || []).map((t) => (t._id === id ? { ...t, status: "verified" } : t)),
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
        <h2 className="mb-4 text-lg font-semibold">{t("admin.allPlayers")}</h2>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.noPendingPlayers")}</p>
        ) : (
          <ul className="space-y-3">
            {players.map((p) => (
              <li
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 p-4"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{p.fullName}</p>
                    <p className="text-sm text-muted-foreground">{p.email}</p>
                  </div>
                  {statusBadge(p.status)}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/players/${p._id}`}>{t("admin.viewDetails")}</Link>
                  </Button>
                  {p.status === "pending" && (
                    <Button
                      size="sm"
                      disabled={approvingId === p._id}
                      onClick={() => handleApprovePlayer(p._id)}
                    >
                      {approvingId === p._id ? "…" : t("admin.approve")}
                    </Button>
                  )}
                  {p.status === "verified" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={approvingId === p._id}
                      onClick={() => handleRejectPlayer(p._id)}
                    >
                      {approvingId === p._id ? "…" : "Disqualify"}
                    </Button>
                  )}
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
            {t("admin.allTeams")} — {league.toUpperCase()}
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
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{team.teamName}</p>
                      {team.franchiseOwner && (
                        <p className="text-sm text-muted-foreground">
                          {team.franchiseOwner.fullName} — {team.franchiseOwner.email}
                        </p>
                      )}
                    </div>
                    {statusBadge(team.status)}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/teams/${league}/${team._id}`}>{t("admin.viewDetails")}</Link>
                    </Button>
                    {team.status === "pending" && (
                      <Button
                        size="sm"
                        disabled={approvingTeam === team._id}
                        onClick={() => handleApproveTeam(league, team._id)}
                      >
                        {approvingTeam === team._id ? "…" : t("admin.approve")}
                      </Button>
                    )}
                    {team.status === "verified" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={approvingTeam === team._id}
                        onClick={() => handleRejectTeam(league, team._id)}
                      >
                        {approvingTeam === team._id ? "…" : "Disqualify"}
                      </Button>
                    )}
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
