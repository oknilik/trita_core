"use client";

import { useCallback, useEffect, useState } from "react";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SuccessCheck } from "@/components/ui/primitives/SuccessCheck";
import { EmojiRow, KUDOS_BADGES, type KudosBadge } from "@/components/team/EmojiRow";

// Kudos-kártya (peer feedback F1) — nevesített köszönet csapattársnak,
// emoji-jelvénnyel; a saját kapott lista. Terv: docs/product/peer-feedback-terv.md

interface KudosItem {
  id: string;
  direction: "received" | "sent";
  fromName: string;
  toName: string;
  message: string;
  emoji: string | null;
  createdAt: string;
}

export function TeamKudos({
  teamId,
  members,
  locale,
}: {
  teamId: string;
  members: Array<{ userId: string; displayName: string }>;
  locale: Locale;
}) {
  const [items, setItems] = useState<KudosItem[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [toUserId, setToUserId] = useState("");
  const [message, setMessage] = useState("");
  const [badge, setBadge] = useState<KudosBadge>("🙌");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/team/${teamId}/kudos`);
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.items ?? []);
      setMeId(json.meId ?? null);
    } finally {
      setLoaded(true);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const targets = members.filter((m) => m.userId !== meId);
  const received = items.filter((item) => item.direction === "received");

  const send = async () => {
    setSending(true);
    setError(null);
    setSent(false);
    try {
      const res = await fetch(`/api/team/${teamId}/kudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, message: message.trim(), emoji: badge }),
      });
      if (!res.ok) {
        setError(t("team.kudos.sendError", locale));
        return;
      }
      setSent(true);
      setMessage("");
      setToUserId("");
      setTimeout(() => setSent(false), 3000);
      load();
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
      <SectionEyebrow className="mb-1">
        {t("team.kudos.eyebrow", locale)}
      </SectionEyebrow>
      <h2 className="mb-1 font-fraunces text-lg text-ink">{t("team.kudos.title", locale)}</h2>
      <p className="mb-4 text-caption leading-relaxed text-ink-body">
        {t("team.kudos.hint", locale)}
      </p>

      {/* Küldés */}
      <div className="mb-5 flex flex-col gap-2.5 rounded-xl border border-sand bg-cream/60 p-4">
        <select
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none focus:border-sage-ring"
        >
          <option value="">{t("team.kudos.pickMember", locale)}</option>
          {targets.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName}
            </option>
          ))}
        </select>

        {/* Emoji-jelvény választó */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-micro uppercase tracking-widest text-muted">
            {t("team.kudos.badgeLabel", locale)}
          </span>
          {KUDOS_BADGES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setBadge(candidate)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[17px] transition ${
                badge === candidate
                  ? "border-sage bg-sage-soft"
                  : "border-sand bg-surface-card hover:border-sage-ring"
              }`}
            >
              {candidate}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={400}
          placeholder={t("team.kudos.placeholder", locale)}
          className="rounded-lg border border-sand bg-surface-card p-3 text-sm text-ink outline-none focus:border-sage-ring"
        />
        <EmojiRow onPick={(emoji) => setMessage((prev) => `${prev}${emoji}`)} />

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={sending}
            disabled={!toUserId || message.trim().length < 3}
            onClick={send}
          >
            {t("team.kudos.send", locale)}
          </Button>
          {sent && (
            <span className="inline-flex items-center gap-1.5 text-caption text-[var(--color-accent-self-deep)]">
              <SuccessCheck /> {t("team.kudos.sentOk", locale)}
            </span>
          )}
          {error && <span className="text-caption text-state-error-fg">{error}</span>}
        </div>
      </div>

      {/* Kapott köszönetek */}
      <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
        {tf("team.kudos.receivedLabel", locale, { count: received.length })}
      </p>
      {!loaded ? (
        <p className="text-caption text-muted">…</p>
      ) : received.length === 0 ? (
        <p className="text-caption text-muted">{t("team.kudos.empty", locale)}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-sand">
          {received.slice(0, 8).map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[17px]">
                {item.emoji ?? "🙌"}
              </span>
              <span className="min-w-0">
                <p className="text-sm leading-relaxed text-ink">„{item.message}”</p>
                <p className="mt-0.5 text-micro text-muted">
                  {item.fromName} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString(
                    locale === "en" ? "en-GB" : "hu-HU",
                  )}
                </p>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
