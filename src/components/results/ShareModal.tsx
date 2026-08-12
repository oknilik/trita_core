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
import { track } from "@/lib/analytics/client";

type EmailState = "idle" | "sending" | "sent" | "error" | "invalid";

export interface ShareCardPreview {
  userName: string;
  personalityType: string;
  topDims: Array<{ label: string; score: number }>;
  glyphDimensions?: Array<{ code: string; score: number }>;
}

/**
 * Fókuszált megosztási flow:
 * - link nélkül egyetlen egyértelmű elsődleges akció;
 * - email, LinkedIn és képkártya egy kompakt másodlagos akciósorban;
 * - visszavonás csak ténylegesen aktív linknél, külön megerősítéssel.
 */
export function ShareModal({
  isOpen,
  onClose,
  preview = null,
  initialToken = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  preview?: ShareCardPreview | null;
  /** Szerverről érkező, már aktív link. A modal megnyitása nem hoz létre tokent. */
  initialToken?: string | null;
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
  const [busy, setBusy] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareUrl = shareToken
    ? `${origin}/share/${shareToken}`
    : null;
  const hasActiveShare = Boolean(shareToken) && !revoked;

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
    setBusy(true);
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
      setBusy(false);
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

  const handleLinkedIn = async () => {
    // Aktív linknél azonnal nyitható a LinkedIn. Új link létrehozásakor előbb
    // nyitunk egy üres ablakot, hogy az aszinkron kérés után se blokkolja a
    // böngésző a felhasználó által kezdeményezett megosztást.
    let popup: Window | null = null;
    if (!shareUrl) {
      popup = window.open("about:blank", "trita-linkedin-share", "width=600,height=640");
      if (popup) popup.opener = null;
    }

    const url = shareUrl ?? (await createLink());
    if (!url) {
      popup?.close();
      return;
    }

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    if (popup) {
      popup.location.href = linkedInUrl;
    } else {
      window.open(linkedInUrl, "_blank", "noopener,noreferrer,width=600,height=640");
    }
  };

  const handleRevoke = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/share", { method: "DELETE" });
      if (!res.ok) throw new Error("REVOKE_FAILED");
      setShareToken(null);
      setRevoked(true);
      setCopied(false);
      setEmailState("idle");
      setEmailOpen(false);
      setManageOpen(false);
      setConfirmRevoke(false);
    } catch {
      setLoadError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("content.shareModalTitle", locale)}
      closeLabel={t("common.close", locale)}
    >
      <div className="flex flex-col gap-4">
        {loadError ? (
          <p role="alert" className="rounded-lg bg-[var(--color-surface-highlight-warm)] px-3 py-2 text-sm text-[var(--color-accent-primary-strong)]">
            {t("content.shareError", locale)}
          </p>
        ) : null}

        {revoked ? (
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <SuccessCheck />
            <p className="max-w-sm text-sm leading-relaxed text-ink-body">
              {t("content.shareRevoked", locale)}
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => void createLink()}
              disabled={busy}
            >
              {t("content.shareCreateNew", locale)}
            </Button>
          </div>
        ) : (
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

            {!hasActiveShare ? (
              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={() => void handleCopy()}
                disabled={busy}
                className="rounded-xl"
              >
                {busy
                  ? t("content.shareCreating", locale)
                  : t("content.shareCreateAndCopy", locale)}
              </Button>
            ) : (
              <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-3.5">
                <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-sage-dark">
                  <SuccessCheck />
                  {t("content.shareActive", locale)}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    aria-label={t("content.shareLinkLabel", locale)}
                    value={shareUrl ?? ""}
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-h-[44px] w-full flex-1 truncate rounded-[10px] border border-sand bg-surface-card px-3 text-base text-ink-body outline-none md:text-caption"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void handleCopy()}
                    disabled={busy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <span className="inline-flex items-center gap-1.5">
                        <SuccessCheck />
                        {t("content.shareCopied", locale)}
                      </span>
                    ) : (
                      t("content.shareCopyLink", locale)
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className={`grid gap-2 ${preview && previewGlyph ? "grid-cols-3" : "grid-cols-2"}`}>
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

              <button
                type="button"
                onClick={() => {
                  track("results.export", { format: "link" });
                  void handleLinkedIn();
                }}
                disabled={busy}
                aria-label={t("content.shareLinkedInLabel", locale)}
                className="flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border-soft)] bg-surface-card px-2 py-2 text-xs font-semibold text-ink-body transition hover:border-sage/40 hover:bg-[var(--color-surface-subtle)] hover:text-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
                </svg>
                LinkedIn
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
              <div className="rounded-xl border border-[var(--color-border-soft)] bg-surface-card p-4">
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
                    <div className="flex flex-col gap-3">
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
                        variant="secondary"
                        onClick={() => void handleSend()}
                        disabled={emailState === "sending" || !email.trim()}
                        className="self-start"
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
              <div className="overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-surface-card">
                <button
                  type="button"
                  aria-expanded={manageOpen}
                  onClick={() => {
                    setManageOpen((open) => !open);
                    setConfirmRevoke(false);
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold text-ink-body"
                >
                  {t("content.shareManage", locale)}
                  <span aria-hidden="true" className={`text-muted transition-transform ${manageOpen ? "rotate-180" : ""}`}>⌄</span>
                </button>
                {manageOpen ? (
                  <div className="border-t border-[var(--color-border-soft)] p-4">
                    {confirmRevoke ? (
                      <div className="rounded-xl border border-[var(--color-state-error-border)] bg-[var(--color-state-error-bg)] p-3.5">
                        <p className="text-sm font-semibold text-[var(--color-state-error-fg)]">
                          {t("content.shareRevokeConfirmTitle", locale)}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-body">
                          {t("content.shareRevokeConfirmBody", locale)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmRevoke(false)}>
                            {t("common.cancel", locale)}
                          </Button>
                          <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void handleRevoke()}>
                            {t("content.shareRevokeConfirm", locale)}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRevoke(true)}
                        className="min-h-[44px] rounded-[10px] px-3 text-sm font-semibold text-[var(--color-state-error-fg)] transition hover:bg-[var(--color-state-error-bg)]"
                      >
                        {t("content.shareRevoke", locale)}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
