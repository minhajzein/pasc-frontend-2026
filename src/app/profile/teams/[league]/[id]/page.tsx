"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { fileToBase64 } from "@/lib/fileToBase64";

const editTeamSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  teamLogo: z.string(),
  sponsorName: z.string(),
  sponsorLogo: z.string(),
});

type EditTeamFormValues = z.infer<typeof editTeamSchema>;

type TeamDetail = {
  _id: string;
  league: string;
  teamName: string;
  teamLogo: string;
  franchiseOwner: { _id: string };
  sponsorDetails: { name: string; logo: string };
  status?: "pending" | "verified" | "rejected";
};

export default function EditTeamPage() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const league = typeof params.league === "string" ? params.league : "";
  const id = typeof params.id === "string" ? params.id : "";

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<EditTeamFormValues>({
    resolver: zodResolver(editTeamSchema),
    defaultValues: { teamName: "", teamLogo: "", sponsorName: "", sponsorLogo: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!league || !id || !user) return;
    setLoading(true);
    apiFetch<TeamDetail>(`/api/leagues/${league}/teams/${id}`)
      .then((data) => {
        setTeam(data);
        form.reset({
          teamName: data.teamName,
          teamLogo: data.teamLogo,
          sponsorName: data.sponsorDetails?.name ?? "",
          sponsorLogo: data.sponsorDetails?.logo ?? "",
        });
      })
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [league, id, user, form]);

  const onSubmit = async (data: EditTeamFormValues) => {
    setError("");
    setSaving(true);
    try {
      await apiFetch(`/api/leagues/${league}/teams/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          teamName: data.teamName,
          teamLogo: data.teamLogo,
          sponsorDetails: { name: data.sponsorName, logo: data.sponsorLogo },
        }),
      });
      router.push("/profile/teams");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (field: "teamLogo" | "sponsorLogo", file: File | null) => {
    if (!file) {
      form.setValue(field, "");
      return;
    }
    fileToBase64(file)
      .then((base64) => form.setValue(field, base64))
      .catch(() => form.setValue(field, ""));
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">{authLoading ? "Loading…" : "Redirecting…"}</p>
      </div>
    );
  }

  if (loading || !team) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">{loading ? "Loading…" : "Team not found or you cannot edit it."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/profile/teams">Back to my teams</Link>
        </Button>
      </div>
    );
  }

  if (String(team.franchiseOwner._id) !== user._id) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Only the franchise owner can edit this team.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/profile/teams">Back to my teams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link href="/profile/teams" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to my teams
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Edit team — {team.teamName}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground">{league.toUpperCase()}</p>
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teamLogo"
            render={() => (
              <FormItem>
                <FormLabel>Team logo</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                      onChange={(e) => handleFile("teamLogo", e.target.files?.[0] ?? null)}
                    />
                    {form.watch("teamLogo") && (
                      <Image
                        src={form.watch("teamLogo")!}
                        alt="Team logo"
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-lg border border-border object-cover"
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sponsorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sponsor name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sponsorLogo"
            render={() => (
              <FormItem>
                <FormLabel>Sponsor logo</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                      onChange={(e) => handleFile("sponsorLogo", e.target.files?.[0] ?? null)}
                    />
                    {form.watch("sponsorLogo") && (
                      <Image
                        src={form.watch("sponsorLogo")!}
                        alt="Sponsor logo"
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded border border-border object-contain bg-muted"
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save team"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
