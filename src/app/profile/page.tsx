"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  whatsApp: z.string(),
  photo: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { t } = useLocale();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", whatsApp: "", photo: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      form.reset({
        fullName: user.fullName ?? "",
        whatsApp: user.whatsApp ?? "",
        photo: user.photo ?? "",
      });
    }
  }, [user, authLoading, router, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: data.fullName,
          whatsApp: data.whatsApp,
          photo: data.photo || undefined,
        }),
      });
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) {
      form.setValue("photo", "");
      return;
    }
    fileToBase64(file)
      .then((base64) => form.setValue("photo", base64))
      .catch(() => form.setValue("photo", ""));
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">{authLoading ? "Loading…" : "Redirecting…"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("auth.backToHome")}
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/teams">{t("auth.myTeams")}</Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{t("auth.profile")}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground">{user.email}</p>
        {user.status && (
          <span
            className={
              user.status === "verified"
                ? "rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
                : user.status === "rejected"
                  ? "rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400"
                  : "rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
            }
          >
            {user.status === "verified" ? t("auth.statusVerified") : user.status === "rejected" ? t("auth.statusRejected") : t("auth.statusPending")}
          </span>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsApp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+91 9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="photo"
            render={() => (
              <FormItem>
                <FormLabel>Photo</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                    {form.watch("photo") && (
                      <Image
                        src={form.watch("photo")!}
                        alt="Profile"
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
          {error && (
            <p className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
