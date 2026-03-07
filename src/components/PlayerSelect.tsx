"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export type PlayerListItem = {
  _id: string;
  fullName: string;
  email: string;
  photo: string;
  /** When listing with league=ppl|pcl|pvl, true if player has paid for that league */
  hasPaidForLeague?: boolean;
};

type PlayerSelectProps = {
  onSelect: (player: PlayerListItem) => void;
  onNew: () => void;
  /** When provided (ppl, pcl, pvl), list includes hasPaidForLeague for each player */
  league?: string;
  searchPlaceholder?: string;
  selectLabel?: string;
  newLabel?: string;
  noResultsLabel?: string;
};

export function PlayerSelect({
  onSelect,
  onNew,
  league,
  searchPlaceholder = "Search by name or email...",
  selectLabel = "Select existing player",
  newLabel = "Create new player",
  noResultsLabel = "No players found. Create a new one below.",
}: PlayerSelectProps) {
  const [q, setQ] = useState("");
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchPlayers = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (search) params.set("q", search);
      if (league) params.set("league", league);
      const list = await apiFetch<PlayerListItem[]>(`/api/players?${params.toString()}`);
      setPlayers(Array.isArray(list) ? list : []);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [league]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length >= 0) fetchPlayers(q.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [q, fetchPlayers]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && searched && (
        <>
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground">{noResultsLabel}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {players.map((player) => (
                <li key={player._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(player)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/20 p-3 text-left transition-colors hover:bg-secondary/40"
                  >
                    {player.photo ? (
                      <Image
                        src={player.photo}
                        alt={player.fullName}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-full border border-border bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{player.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{player.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onNew}>
            {newLabel}
          </Button>
        </>
      )}
    </div>
  );
}
