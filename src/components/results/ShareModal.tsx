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
 * - link nélkül egyetlen egyértelmű elsődleges akció;
 * - email és képkártya fokozatosan feltárható másodlagos utak;
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
      description={t("content.shareModalDesc", locale)}
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
                <p className="mb-2 font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                  {t("content.shareRecipientPreview", locale)}
                </p>
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
                <p className="mt-2.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {t("content.sharePrivacySummary", locale)}
                </p>
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

            <div className="overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-surface-card">
              <button
                type="button"
                aria-expanded={emailOpen}
                onClick={() => setEmailOpen((open) => !open)}
                className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold text-ink"
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">✉</span>
                  {t("content.shareEmailToggle", locale)}
                </span>
                <span aria-hidden="true" className={`text-muted transition-transform ${emailOpen ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {emailOpen ? (
                <div className="border-t border-[var(--color-border-soft)] p-4">
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
            </div>

            {preview && previewGlyph ? (
              <ShareCardDownload
                userName={preview.userName}
                personalityType={preview.personalityType}
                topDims={preview.topDims}
                glyph={previewGlyph}
              />
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
            ) : (
              <p className="text-center text-micro text-muted">
                {t("content.shareRevocableHint", locale)}
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
