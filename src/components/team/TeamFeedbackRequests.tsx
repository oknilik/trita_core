"use client";

import { useCallback, useEffect, useState } from "react";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SuccessCheck } from "@/components/ui/primitives/SuccessCheck";
import { hasJudgmentTone } from "@/lib/feedback-tone";
import { EmojiRow } from "@/components/team/EmojiRow";

// Visszajelzés-kérések és fejlesztő javaslatok (peer feedback F2 + F3
// címzett-oldala) a csapat-oldal Tagok fülén.

interface MyRequest {
  id: string;
  topic: string;
  allowAnonymous: boolean;
  status: string;
  audienceCount: number;
  createdAt: string;
  responses: Array<{
    id: string;
    fromName: string | null;
    continueText: string;
    tryText: string;
    comment: string | null;
  }>;
}

interface RequestForMe {
  id: string;
  topic: string;
  allowAnonymous: boolean;
  askerName: string;
  createdAt: string;
}

interface Suggestion {
  id: string;
  fromName: string | null;
  continueText: string;
  tryText: string;
}

export function TeamFeedbackRequests({
  teamId,
  members,
  locale,
}: {
  teamId: string;
  members: Array<{ userId: string; displayName: string }>;
  locale: Locale;
}) {
  const [meId, setMeId] = useState<string | null>(null);
  const [mine, setMine] = useState<MyRequest[]>([]);
  const [forMe, setForMe] = useState<RequestForMe[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pendingAnonymous, setPendingAnonymous] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Új kérés form
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState<Set<string>>(new Set());
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // Válasz form (egyszerre egy nyitott)
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [continueText, setContinueText] = useState("");
  const [tryText, setTryText] = useState("");
  const [comment, setComment] = useState("");
  const [respondAnonymous, setRespondAnonymous] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/team/${teamId}/feedback-requests`);
      if (!res.ok) return;
      const json = await res.json();
      setMeId(json.meId ?? null);
      setMine(json.mine ?? []);
      setForMe(json.forMe ?? []);
      setSuggestions(json.suggestions ?? []);
      setPendingAnonymous(json.pendingAnonymous ?? 0);
    } finally {
      setLoaded(true);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAudience = (userId: string) =>
    setAudience((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const createRequest = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/feedback-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          audienceIds: Array.from(audience),
          allowAnonymous,
        }),
      });
      if (!res.ok) {
        setError(t("team.fb.createError", locale));
        return;
      }
      setCreated(true);
      setTopic("");
      setAudience(new Set());
      setAllowAnonymous(false);
      setTimeout(() => setCreated(false), 3000);
      load();
    } finally {
      setCreating(false);
    }
  };

  const respond = async (requestId: string) => {
    setSendingResponse(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/feedback-requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          continueText: continueText.trim(),
          tryText: tryText.trim(),
          ...(comment.trim() && !respondAnonymous ? { comment: comment.trim() } : {}),
          anonymous: respondAnonymous,
        }),
      });
      if (!res.ok) {
        setError(t("team.fb.respondError", locale));
        return;
      }
      setRespondingTo(null);
      setContinueText("");
      setTryText("");
      setComment("");
      setRespondAnonymous(false);
      load();
    } finally {
      setSendingResponse(false);
    }
  };

  const targets = members.filter((m) => m.userId !== meId);
  const textareaClass =
    "w-full rounded-lg border border-sand bg-surface-card p-3 text-sm text-ink outline-none focus:border-sage-ring";
  const judgy = hasJudgmentTone(continueText) || hasJudgmentTone(tryText) || hasJudgmentTone(comment);

  return (
    <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
      <SectionEyebrow className="mb-1">
        {t("team.fb.eyebrow", locale)}
      </SectionEyebrow>
      <h2 className="mb-1 font-fraunces text-lg text-ink">{t("team.fb.title", locale)}</h2>
      <p className="mb-4 text-caption leading-relaxed text-ink-body">{t("team.fb.hint", locale)}</p>

      {/* Rám váró kérések */}
      {forMe.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
            {tf("team.fb.forMeLabel", locale, { count: forMe.length })}
          </p>
          <div className="flex flex-col gap-3">
            {forMe.map((request) => (
              <div key={request.id} className="rounded-xl border border-sage-ring bg-sage-ghost p-4">
                <p className="text-sm text-ink">
                  <span className="font-semibold">{request.askerName}</span>{" "}
                  {t("team.fb.asksAbout", locale)}{" "}
                  <span className="font-semibold">„{request.topic}”</span>
                </p>
                {respondingTo === request.id ? (
                  <div className="mt-3 flex flex-col gap-2.5">
                    <label className="text-caption font-semibold text-ink-body">
                      {t("team.fb.continueLabel", locale)}
                    </label>
                    <textarea rows={2} maxLength={400} value={continueText} onChange={(e) => setContinueText(e.target.value)} className={textareaClass} />
                    <label className="text-caption font-semibold text-ink-body">
                      {t("team.fb.tryLabel", locale)}
                    </label>
                    <textarea rows={2} maxLength={400} value={tryText} onChange={(e) => setTryText(e.target.value)} className={textareaClass} />
                    <EmojiRow onPick={(emoji) => setTryText((prev) => `${prev}${emoji}`)} />
                    {!respondAnonymous && (
                      <>
                        <label className="text-caption font-semibold text-ink-body">
                          {t("team.fb.commentLabel", locale)}{" "}
                          <span className="font-normal text-muted">{t("team.fb.optional", locale)}</span>
                        </label>
                        <textarea rows={2} maxLength={400} value={comment} onChange={(e) => setComment(e.target.value)} className={textareaClass} />
                      </>
                    )}
                    {request.allowAnonymous && (
                      <label className="flex cursor-pointer items-center gap-2 text-caption text-ink-body">
                        <input
                          type="checkbox"
                          checked={respondAnonymous}
                          onChange={(e) => setRespondAnonymous(e.target.checked)}
                          className="h-4 w-4 accent-sage"
                        />
                        {t("team.fb.respondAnonymously", locale)}
                      </label>
                    )}
                    {judgy && (
                      <p className="rounded-lg bg-[var(--color-state-warning-bg)] px-3 py-2 text-micro leading-relaxed text-[var(--color-state-warning-fg)]">
                        {t("peerFb.toneNudge", locale)}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        loading={sendingResponse}
                        disabled={continueText.trim().length < 3 || tryText.trim().length < 3}
                        onClick={() => respond(request.id)}
                      >
                        {t("team.fb.sendResponse", locale)}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setRespondingTo(null)}>
                        {t("team.fb.cancel", locale)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2.5"
                    onClick={() => setRespondingTo(request.id)}
                  >
                    {t("team.fb.respond", locale)}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Új kérés */}
      <div className="mb-5 rounded-xl border border-sand bg-cream/60 p-4">
        <p className="mb-2 text-caption font-semibold text-ink">{t("team.fb.newRequestTitle", locale)}</p>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={200}
          placeholder={t("team.fb.topicPlaceholder", locale)}
          className="mb-2.5 min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none focus:border-sage-ring"
        />
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {targets.map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => toggleAudience(m.userId)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                audience.has(m.userId)
                  ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                  : "border-sand bg-surface-card text-ink-body hover:border-sage-ring"
              }`}
            >
              {m.displayName}
            </button>
          ))}
        </div>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-caption text-ink-body">
          <input
            type="checkbox"
            checked={allowAnonymous}
            onChange={(e) => setAllowAnonymous(e.target.checked)}
            className="h-4 w-4 accent-sage"
          />
          {t("team.fb.allowAnonymous", locale)}
        </label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={creating}
            disabled={topic.trim().length < 3 || audience.size === 0}
            onClick={createRequest}
          >
            {t("team.fb.create", locale)}
          </Button>
          {created && (
            <span className="inline-flex items-center gap-1.5 text-caption text-[var(--color-accent-self-deep)]">
              <SuccessCheck /> {t("team.fb.createdOk", locale)}
            </span>
          )}
          {error && <span className="text-caption text-state-error-fg">{error}</span>}
        </div>
      </div>

      {/* Saját kéréseim + válaszok */}
      {loaded && mine.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
            {t("team.fb.mineLabel", locale)}
          </p>
          <div className="flex flex-col gap-3">
            {mine.slice(0, 5).map((request) => (
              <div key={request.id} className="rounded-xl border border-sand p-4">
                <p className="text-sm font-semibold text-ink">„{request.topic}”</p>
                <p className="mt-0.5 text-micro text-muted">
                  {tf("team.fb.requestMeta", locale, {
                    count: request.responses.length,
                    total: request.audienceCount,
                  })}
                  {request.allowAnonymous ? ` · ${t("team.fb.anonBadge", locale)}` : ""}
                </p>
                {request.responses.length > 0 && (
                  <ul className="mt-2.5 flex flex-col gap-2.5">
                    {request.responses.map((response) => (
                      <li key={response.id} className="rounded-lg bg-cream/70 p-3">
                        <p className="text-caption text-ink">
                          <span className="font-semibold text-[var(--color-accent-self-deep)]">
                            {t("team.fb.continueShort", locale)}:
                          </span>{" "}
                          {response.continueText}
                        </p>
                        <p className="mt-1 text-caption text-ink">
                          <span className="font-semibold text-[var(--color-accent-primary-strong)]">
                            {t("team.fb.tryShort", locale)}:
                          </span>{" "}
                          {response.tryText}
                        </p>
                        {response.comment && (
                          <p className="mt-1 text-caption text-ink-body">{response.comment}</p>
                        )}
                        <p className="mt-1 text-micro text-muted">
                          {response.fromName ?? t("team.fb.anonymousResponder", locale)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kampány-körből kapott javaslataim */}
      {loaded && (suggestions.length > 0 || pendingAnonymous > 0) && (
        <div>
          <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
            {t("team.fb.suggestionsLabel", locale)}
          </p>
          {suggestions.length > 0 && (
            <ul className="flex flex-col gap-2.5">
              {suggestions.map((item) => (
                <li key={item.id} className="rounded-lg bg-cream/70 p-3">
                  <p className="text-caption text-ink">
                    <span className="font-semibold text-[var(--color-accent-self-deep)]">
                      {t("team.fb.continueShort", locale)}:
                    </span>{" "}
                    {item.continueText}
                  </p>
                  <p className="mt-1 text-caption text-ink">
                    <span className="font-semibold text-[var(--color-accent-primary-strong)]">
                      {t("team.fb.tryShort", locale)}:
                    </span>{" "}
                    {item.tryText}
                  </p>
                  <p className="mt-1 text-micro text-muted">
                    {item.fromName ?? t("team.fb.anonymousResponder", locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {pendingAnonymous > 0 && (
            <p className="mt-2 text-micro text-muted">
              {tf("team.fb.pendingAnonymous", locale, { count: pendingAnonymous })}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
