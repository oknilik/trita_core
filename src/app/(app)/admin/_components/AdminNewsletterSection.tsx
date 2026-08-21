"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/Button";
import { SelectField } from "@/components/ui/primitives/SelectField";
import type { NewsletterStats } from "@/lib/newsletter";

/**
 * Admin hírlevél-blokk a Blog fül tetején.
 *
 * A SZÁMOK a szerverről, DB-ből jönnek (üzleti szám sosem eseményből — ld.
 * CLAUDE.md analitika-szabály); a művelet-gombok a `/api/admin/newsletter`
 * végpontra mennek.
 *
 * A „küldés most" ugyanazt a motort hívja, mint a napi cron, tehát a napló
 * ugyanúgy véd a kettős küldéstől. A próbafutás ezért nem óvatoskodás, hanem
 * a normál munkamenet: előbb megnézed, hánynak menne, aztán küldesz.
 */

interface AdminNewsletterSectionProps {
  stats: NewsletterStats;
  /** Publikált cikkek (slug + cím) a küldés-választóhoz. */
  posts: Array<{ slug: string; title: string; locale: "hu" | "en" }>;
}

export function AdminNewsletterSection({ stats, posts }: AdminNewsletterSectionProps) {
  const [slug, setSlug] = useState(posts[0]?.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    if (!slug) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, dryRun }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        sent?: Array<{ recipients: number }>;
        failed?: number;
      };
      if (!res.ok || !data.ok) throw new Error("SEND_FAILED");

      const recipients = (data.sent ?? []).reduce((sum, s) => sum + s.recipients, 0);
      setMessage(
        dryRun
          ? `Próbafutás: ${recipients} címzettnek menne ki.`
          : `Kiküldve ${recipients} címzettnek${data.failed ? ` (${data.failed} hiba)` : ""}.`,
      );
    } catch {
      setMessage("A küldés nem sikerült — nézd meg a szerver-naplót.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-sand bg-surface-card p-6">
      <p className="font-dm-mono text-micro font-semibold uppercase tracking-widest text-muted">
        Hírlevél
      </p>

      <div className="mt-3 flex flex-wrap gap-6">
        <Stat label="Aktív" value={stats.active} />
        <Stat label="Megerősítésre vár" value={stats.pending} />
        <Stat label="Leiratkozott" value={stats.unsubscribed} />
        <Stat label="Visszapattant" value={stats.bounced} />
      </div>

      <p className="mt-3 text-micro text-muted">
        Utolsó kiküldés:{" "}
        {stats.lastSentAt
          ? new Date(stats.lastSentAt).toLocaleString("hu-HU")
          : "még nem volt"}
      </p>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
        <SelectField
          label="Cikk"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          containerClassName="flex-1"
        >
          {posts.map((post) => (
            <option key={post.slug} value={post.slug}>
              [{post.locale}] {post.title}
            </option>
          ))}
        </SelectField>

        <div className="flex gap-2">
          <Button variant="secondary" disabled={busy || !slug} onClick={() => void run(true)}>
            Próbafutás
          </Button>
          <Button disabled={busy || !slug} loading={busy} onClick={() => void run(false)}>
            Küldés most
          </Button>
        </div>
      </div>

      {message ? <p className="mt-3 text-caption text-ink-body">{message}</p> : null}

      <p className="mt-4 text-micro leading-relaxed text-muted">
        A napi cron (06:00 UTC) magától kiküldi az elmúlt 14 napban megjelent
        cikkeket. A kézi küldés ugyanazt a naplót használja: aki már megkapta
        a cikket, nem kapja meg újra.{" "}
        <a
          href="/api/admin/newsletter?format=csv"
          className="underline underline-offset-2 hover:text-ink"
        >
          Aktív feliratkozók exportja (CSV)
        </a>
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex flex-col">
      <span className="font-fraunces text-title leading-none text-ink">{value}</span>
      <span className="mt-1 text-micro uppercase tracking-wide text-muted">{label}</span>
    </span>
  );
}
