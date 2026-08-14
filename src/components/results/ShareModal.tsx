"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives/Button";
import { SuccessCheck } from "@/components/ui/primitives/SuccessCheck";
import { TextField } from "@/components/ui/primitives/TextField";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { resolveGlyphPair } from "@/lib/type-glyph";
import { isSecondaryUncertain } from "@/lib/personality-type";
import { ShareCardDownload } from "@/components/results/ShareCardDownload";

type EmailState = "idle" | "sending" | "sent" | "error" | "invalid";

export interface ShareCardPreview {
  userName: string;
  personalityType: string;
  topDims: Array<{ label: string; score: number }>;
  glyphDimensions?: Array<{ code: string; score: number }>;
}

/**
 * Fókuszált megosztási flow:
 * - link, email és képkártya egyetlen kompakt akciósorban;
 * - visszavonás csak ténylegesen aktív linknél, külön megerősítéssel.
 */
export function ShareModal({
  isOpen,
  onClose,
  preview = null,
  initialToken = null,
  initialHasShare = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  preview?: ShareCardPreview | null;
  /** Szerverről érkező, már aktív link. A modal megnyitása nem hoz létre tokent. */
  initialToken?: string | null;
  /**
   * Van-e élő megosztás akkor is, ha a LEGUTÓBBI eredményhez nem tartozik
   * token (újrakitöltés után a régi eredmény linkje még nyílik). A DELETE
   * minden tokent visszavon, ezért a visszavonást ehhez kötjük — különben a
   * kint maradt régi link a felületről nem lenne visszavonható.
   */
  initialHasShare?: boolean;
}) {
  const { locale } = useLocale();
  const previewGlyph = preview?.glyphDimensions
    ? resolveGlyphPair(preview.glyphDimensions)
    : null;
  const previewGlyphUncertain = preview?.glyphDimensions
    ? isSecondaryUncertain(preview.glyphDimensions)
    : false;

  const [origin, setOrigin] = useState("");
  const [shareToken, setShareToken] = useState<string | null>(initialToken);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  // Melyik művelet fut — a „Link létrehozása…" felirat csak a link-ághoz
  // tartozik; egy közös `busy` a visszavonás alatt is átírta a Link gombot.
  const [pending, setPending] = useState<null | "link" | "revoke">(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareUrl = shareToken
    ? `${origin}/share/${shareToken}`
    : null;
  const hasActiveShare = (Boolean(shareToken) || initialHasShare) && !revoked;

  useEffect(() => {
    setOrigin(window.location.origin);
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Az újranyitás csak a rövid visszajelzéseket nullázza; az aktív link és
    // a felhasználó által kinyitott csatorna megmarad a munkamenetben.
    setCopied(false);
    setLoadError(false);
    setConfirmRevoke(false);
    setEmailState((state) => state === "sent" ? state : "idle");
  }, [isOpen]);

  const createLink = useCallback(async (): Promise<string | null> => {
    setPending("link");
    setLoadError(false);
    try {
      const res = await fetch("/api/profile/share", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error("NO_TOKEN");
      setShareToken(data.token);
      setRevoked(false);
      return `${window.location.origin}/share/${data.token}`;
    } catch {
      setLoadError(true);
      return null;
    } finally {
      setPending(null);
    }
  }, []);

  const handleCopy = async () => {
    const url = shareUrl ?? (await createLink());
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2400);
    } catch {
      setLoadError(true);
    }
  };

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailState("invalid");
      return;
    }
    setEmailState("sending");
    try {
      const res = await fetch("/api/profile/share/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      // A token akkor is létrejöhetett, ha maga az email-küldés elbukott.
      // Ilyenkor se mutassunk tévesen „nincs aktív link" állapotot.
      if (data.token) {
        setShareToken(data.token);
        setRevoked(false);
      }
      if (!res.ok) throw new Error("SEND_FAILED");
      setSentEmail(trimmed);
      setEmailState("sent");
      setEmail("");
    } catch {
      setEmailState("error");
    }
  };

  const handleRevoke = async () => {
    setPending("revoke");
    try {
      const res = await fetch("/api/profile/share", { method: "DELETE" });
      if (!res.ok) throw new Error("REVOKE_FAILED");
      setShareToken(null);
      setRevoked(true);
      setCopied(false);
      setEmailState("idle");
      setEmailOpen(false);
      setConfirmRevoke(false);
    } catch {
      setLoadError(true);
    } finally {
      setPending(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("content.shareModalTitle", locale)}
      closeLabel={t("common.close", locale)}
      mobilePosition="center"
    >
      <div className="flex flex-col gap-4">
        {loadError ? (
          <p role="alert" className="rounded-lg bg-[var(--color-surface-highlight-warm)] px-3 py-2 text-sm text-[var(--color-accent-primary-strong)]">
            {t("content.shareError", locale)}
          </p>
        ) : null}

        {revoked ? (
          <p role="status" className="inline-flex items-center gap-2 rounded-lg bg-sage-soft px-3 py-2 text-sm text-sage-dark">
            <SuccessCheck />
            {t("content.shareRevoked", locale)}
          </p>
        ) : null}

        <>
            {preview ? (
              <div>
                <div
                  className="relative overflow-hidden rounded-2xl p-4"
                  style={{
                    background:
                      "linear-gradient(140deg, var(--color-accent-self-strong) 0%, var(--color-accent-self-deep) 55%, var(--color-accent-self-deeper) 100%)",
                  }}
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/[0.04]" />
                  <div className="flex items-center gap-3">
                    {previewGlyph ? (
                      <TypeGlyph
                        primaryCode={previewGlyph.primaryCode}
                        secondaryCode={previewGlyph.secondaryCode}
                        typeLabel={preview.personalityType}
                        locale={locale === "hu" ? "hu" : "en"}
                        intensity={previewGlyph.intensity}
                        secondaryUncertain={previewGlyphUncertain}
                        variant="badge"
                        className="h-11 w-11 shrink-0 rounded-lg border border-white/20"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="font-fraunces text-[17px] text-white">{preview.userName}</p>
                      <p className="font-fraunces text-body italic text-[var(--color-accent-primary-soft)]">
                        {preview.personalityType}
                      </p>
                    </div>
                  </div>
                  {preview.topDims.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {preview.topDims.map((dimension) => (
                        <span
                          key={dimension.label}
                          className="rounded-full bg-white/[0.12] px-2.5 py-1 text-micro font-medium text-white/[0.78]"
                        >
                          {dimension.label} {dimension.score}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {preview ? (
              <p className="text-xs leading-relaxed text-muted">
                {t("results.shareVisibleSummary", locale)}
              </p>
            ) : null}

            <div className={`grid gap-2 ${preview && previewGlyph ? "grid-cols-3" : "grid-cols-2"}`}>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={pending !== null}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${copied ? "border-sage/40 bg-sage-soft text-sage-dark" : "border-[var(--color-border-soft)] bg-surface-card text-ink-body hover:bg-[var(--color-surface-subtle)] hover:text-ink"} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {copied ? <SuccessCheck /> : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
                    <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15" />
                  </svg>
                )}
                {pending === "link"
                  ? t("content.shareCreating", locale)
                  : copied
                    ? t("content.shareCopied", locale)
                    : t("content.shareCopyLink", locale)}
              </button>

              <button
                type="button"
                aria-expanded={emailOpen}
                onClick={() => setEmailOpen((open) => !open)}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${emailOpen ? "border-sage/40 bg-sage-soft text-sage-dark" : "border-[var(--color-border-soft)] bg-surface-card text-ink-body hover:bg-[var(--color-surface-subtle)] hover:text-ink"}`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                {t("content.shareEmailCompact", locale)}
              </button>

              {preview && previewGlyph ? (
                <ShareCardDownload
                  userName={preview.userName}
                  personalityType={preview.personalityType}
                  topDims={preview.topDims}
                  glyph={previewGlyph}
                  compact
                />
              ) : null}
            </div>

            {emailOpen ? (
              <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-3.5">
                  {emailState === "sent" ? (
                    <div className="rounded-xl border border-sage/25 bg-sage-soft p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-sage-dark">
                        <SuccessCheck />
                        {t("content.shareEmailSentTo", locale)} {sentEmail}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-body">
                        {t("content.shareEmailQrHint", locale)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailState("idle");
                          setSentEmail("");
                        }}
                        className="mt-3 min-h-[40px] text-xs font-semibold text-sage-dark underline decoration-sage/30 underline-offset-4"
                      >
                        {t("content.shareAnotherRecipient", locale)}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <TextField
                        type="email"
                        label={t("content.shareEmailLabel", locale)}
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (emailState === "invalid" || emailState === "error") setEmailState("idle");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void handleSend();
                        }}
                        placeholder={t("content.shareEmailPlaceholder", locale)}
                        labelClassName="text-xs font-semibold text-ink-body"
                        inputClassName="rounded-xl border-[var(--color-border-soft)] bg-surface-card px-3.5 shadow-[var(--ui-shadow-sm)]"
                        error={
                          emailState === "invalid"
                            ? t("content.shareEmailInvalid", locale)
                            : emailState === "error"
                              ? t("content.shareEmailError", locale)
                              : undefined
                        }
                      />
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        onClick={() => void handleSend()}
                        disabled={emailState === "sending" || !email.trim()}
                        className="rounded-xl"
                      >
                        {emailState === "sending"
                          ? t("content.shareEmailSending", locale)
                          : t("content.shareEmailSend", locale)}
                      </Button>
                    </div>
                  )}
              </div>
            ) : null}

            {hasActiveShare ? (
              <div className="border-t border-[var(--color-border-soft)] pt-3">
                {confirmRevoke ? (
                  <div className="rounded-xl border border-[var(--color-state-error-border)] bg-[var(--color-surface-subtle)] p-3.5">
                    <p className="text-sm font-semibold text-ink">
                      {t("content.shareRevokeConfirmTitle", locale)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-body">
                      {t("content.shareRevokeConfirmBody", locale)}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmRevoke(false)}>
                        {t("common.cancel", locale)}
                      </Button>
                      <Button type="button" variant="destructive" size="sm" disabled={pending !== null} onClick={() => void handleRevoke()}>
                        {t("content.shareRevokeConfirm", locale)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[44px] items-center justify-between gap-3 px-1">
                    <p className="inline-flex min-w-0 items-center gap-2 text-xs font-medium text-ink-body">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-sage" />
                      {t("content.shareStatusActive", locale)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setConfirmRevoke(true)}
                      className="min-h-[40px] shrink-0 rounded-lg px-2 text-xs font-semibold text-muted underline decoration-sand underline-offset-4 transition hover:bg-[var(--color-state-error-bg)] hover:text-[var(--color-state-error-fg)]"
                    >
                      {t("content.shareRevokeShort", locale)}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
        </>
      </div>
    </Modal>
  );
}
