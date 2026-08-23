"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  BULK_INVITE_BATCH_SIZE,
  chunkEmails,
  parseEmailList,
  summarizeBulkInvite,
  type BulkInviteResult,
} from "@/lib/bulk-invite";
import { Button } from "@/components/ui/primitives/Button";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";
import { TextareaField } from "@/components/ui/primitives/TextareaField";

interface BulkInvitePanelProps {
  /** A meghívó végpont — org vagy csapat. */
  endpoint: string;
  locale: Locale;
  /** Org-meghívónál a kiosztott szerep; csapatnál nincs. */
  role?: string;
}

/**
 * Tömeges meghívás — beillesztett címlistából.
 *
 * MIÉRT KÖTEGEL A KLIENS: minden új címhez kimegy egy levél, sorban. Egy
 * 500-as listát egyetlen kérésben feldolgozni túllépné a szerver-nélküli
 * futásidő-korlátot, és félúton elvágva nem tudnánk, mi ment ki. Ezért a
 * lista `BULK_INVITE_BATCH_SIZE`-os kötegekre bomlik, a haladás látszik, és
 * egy megszakadt köteg után az addigi eredmény megmarad a képernyőn.
 *
 * A kötegek SORBAN mennek, nem párhuzamosan: a szerver is sorban küld, és a
 * párhuzamos kérések csak a rate limitbe futnának.
 */
export function BulkInvitePanel({ endpoint, locale, role }: BulkInvitePanelProps) {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<BulkInviteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ugyanaz az elemző fut itt és a szerveren — a szabályok nem csúszhatnak szét.
  const { emails, invalid } = useMemo(() => parseEmailList(raw), [raw]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emails.length === 0 || sending) return;

    setSending(true);
    setError(null);
    setResults(null);

    const chunks = chunkEmails(emails, BULK_INVITE_BATCH_SIZE);
    const collected: BulkInviteResult[] = [];
    setProgress({ done: 0, total: emails.length });

    try {
      for (const chunk of chunks) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: chunk, ...(role ? { role } : {}) }),
        });

        if (!res.ok) {
          // A már feldolgozott kötegek eredményét MEGTARTJUK: a tanácsadónak
          // tudnia kell, kinek ment ki már meghívó, mielőtt újrapróbálja.
          setError(t("org.forms.inviteGenericError", locale));
          break;
        }

        const data: { results?: BulkInviteResult[] } = await res.json();
        collected.push(...(data.results ?? []));
        setProgress({ done: collected.length, total: emails.length });
        setResults([...collected]);
      }
    } catch {
      setError(t("org.forms.inviteNetworkError", locale));
    } finally {
      setSending(false);
      setProgress(null);
      if (collected.length > 0) {
        setResults(collected);
        // A már feldolgozott címek eltűnnek a mezőből; ami hátramaradt, azt
        // egy újrapróbálásnál nem küldjük ki még egyszer.
        const done = new Set(collected.map((r) => r.email));
        setRaw(emails.filter((email) => !done.has(email)).join("\n"));
        router.refresh();
      }
    }
  }

  const summary = results ? summarizeBulkInvite(results) : null;

  /** Csak a nem nulla tételek jelennek meg — a nullás sorok csak zajt adnának. */
  const summaryLines: { key: string; count: number; tone: "ok" | "warn" }[] = summary
    ? [
        { key: "org.forms.bulkAdded", count: summary.added, tone: "ok" as const },
        { key: "org.forms.bulkInvited", count: summary.invited, tone: "ok" as const },
        { key: "org.forms.bulkNoEmail", count: summary.invited_no_email, tone: "warn" as const },
        { key: "org.forms.bulkAlready", count: summary.already_member, tone: "warn" as const },
        { key: "org.forms.bulkSelf", count: summary.self_invite, tone: "warn" as const },
        { key: "org.forms.bulkFailed", count: summary.failed, tone: "warn" as const },
      ].filter((line) => line.count > 0)
    : [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextareaField
        label={t("org.forms.bulkLabel", locale)}
        rows={6}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={t("org.forms.bulkPlaceholder", locale)}
        disabled={sending}
      />

      <p className="text-note text-[var(--color-text-muted)]">
        {t("org.forms.bulkHint", locale)}
      </p>

      {emails.length > 0 && (
        <p className="text-caption font-semibold text-[var(--color-text-primary)]">
          {tf("org.forms.bulkParsed", locale, { count: emails.length })}
        </p>
      )}

      {invalid.length > 0 && (
        <InlineBanner variant="warning">
          {tf("org.forms.bulkInvalid", locale, {
            count: invalid.length,
            // Legfeljebb öt példa: a teljes lista hosszabb lehet a képernyőnél.
            list: invalid.slice(0, 5).join(", ") + (invalid.length > 5 ? "…" : ""),
          })}
        </InlineBanner>
      )}

      <div>
        <Button type="submit" disabled={sending || emails.length === 0} className="px-6">
          {sending && progress
            ? tf("org.forms.bulkProgress", locale, { done: progress.done, total: progress.total })
            : tf("org.forms.bulkSubmit", locale, { count: emails.length })}
        </Button>
      </div>

      {summary && results && results.length > 0 && (
        <div className="flex flex-col gap-2">
          <InlineBanner variant="success">
            {tf("org.forms.bulkDone", locale, { total: results.length })}
          </InlineBanner>
          <ul className="flex flex-col gap-1 pl-1">
            {summaryLines.map((line) => (
              <li
                key={line.key}
                className={
                  line.tone === "warn"
                    ? "text-caption text-[var(--color-text-secondary)]"
                    : "text-caption text-[var(--color-text-primary)]"
                }
              >
                {tf(line.key, locale, { count: line.count })}
              </li>
            ))}
          </ul>

          {/* A „meghívó kész, levél nem ment ki" eset címei NÉVVEL kellenek:
              ezeknek kézzel kell linket küldeni, összesítésből nem derül ki, kinek. */}
          {summary.invited_no_email > 0 && (
            <p className="text-note text-[var(--color-text-muted)]">
              {results
                .filter((r) => r.status === "invited_no_email")
                .map((r) => r.email)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {error && <InlineBanner variant="error">{error}</InlineBanner>}
    </form>
  );
}
