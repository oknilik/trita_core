"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";

type EmailState = "idle" | "sending" | "sent" | "error" | "invalid";

// Megosztás-kezelő modal: link létrehozás + vágólap-másolás inline
// visszajelzéssel (nincs böngésző-alert), opcionális email-küldés és
// visszavonás — mind egy helyen, a flow megszakítása nélkül.
export interface ShareCardPreview {
  userName: string;
  personalityType: string;
  topDims: Array<{ label: string; score: number }>;
}

export function ShareModal({
  isOpen,
  onClose,
  preview = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** Archetípus-kártya előnézet (F3) — mit lát, aki megkapja a linket. */
  preview?: ShareCardPreview | null;
}) {
  const { locale } = useLocale();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const createLink = useCallback(async () => {
    setBusy(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/profile/share", { method: "POST" });
      const data = await res.json();
      if (!data.token) throw new Error("NO_TOKEN");
      setShareUrl(`${window.location.origin}/share/${data.token}`);
      setRevoked(false);
    } catch {
      setLoadError(true);
    } finally {
      setBusy(false);
    }
  }, []);

  // Megnyitáskor létrehozzuk (vagy visszakapjuk a meglévő) linket.
  useEffect(() => {
    if (isOpen && !shareUrl && !revoked) void createLink();
    if (isOpen) {
      setCopied(false);
      setEmailState("idle");
    }
  }, [isOpen, shareUrl, revoked, createLink]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
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
      if (!res.ok) throw new Error("SEND_FAILED");
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
      setShareUrl(null);
      setRevoked(true);
      setCopied(false);
      setEmailState("idle");
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
    >
      <div className="flex flex-col gap-5">
        {loadError && (
          <p className="rounded-lg bg-[var(--color-surface-highlight-warm)] px-3 py-2 text-sm text-[var(--color-accent-primary-strong)]">
            {t("content.shareError", locale)}
          </p>
        )}

        {revoked ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm leading-relaxed text-ink-body">
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
            {/* Archetípus-kártya előnézet (F3) — a megosztás „arca": ezt
                látja először, aki megnyitja a linket. */}
            {preview && (
              <div
                className="relative overflow-hidden rounded-2xl p-5"
                style={{
                  background:
                    "linear-gradient(140deg, var(--color-accent-self-strong) 0%, var(--color-accent-self-deep) 55%, var(--color-accent-self-deeper) 100%)",
                }}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/[0.04]" />
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/[0.35]">
                  {t("results.sharedProfileLabel", locale)}
                </p>
                <p className="mt-0.5 font-fraunces text-[17px] text-white">
                  {preview.userName}
                </p>
                <p className="font-fraunces text-[15px] italic text-[var(--color-accent-primary-soft)]">
                  {preview.personalityType}
                </p>
                {preview.topDims.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {preview.topDims.map((d) => (
                      <span
                        key={d.label}
                        className="rounded-full bg-white/[0.12] px-2.5 py-1 text-[10px] font-medium text-white/[0.75]"
                      >
                        {d.label} {d.score}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Link + másolás */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("content.shareLinkLabel", locale)}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={shareUrl ?? "…"}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-h-[44px] w-full flex-1 truncate rounded-[10px] border border-sand bg-cream px-3 text-[13px] text-ink-body outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleCopy()}
                  disabled={!shareUrl || busy}
                  className="shrink-0"
                >
                  {copied ? (
                    <span className="inline-flex items-center gap-1.5 text-sage-dark">
                      <span
                        aria-hidden
                        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sage text-[10px] font-bold leading-none text-white"
                      >
                        ✓
                      </span>
                      {t("content.shareCopied", locale)}
                    </span>
                  ) : (
                    t("content.shareCopyLink", locale)
                  )}
                </Button>
              </div>
            </div>

            {/* Email küldés */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("content.shareEmailLabel", locale)}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <TextField
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailState === "invalid" || emailState === "error") setEmailState("idle");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSend();
                  }}
                  placeholder={t("content.shareEmailPlaceholder", locale)}
                  containerClassName="flex-1"
                  error={
                    emailState === "invalid"
                      ? t("content.shareEmailInvalid", locale)
                      : emailState === "error"
                        ? t("content.shareError", locale)
                        : undefined
                  }
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void handleSend()}
                  disabled={emailState === "sending" || !email.trim()}
                  className="shrink-0 self-start"
                >
                  {emailState === "sending"
                    ? t("content.shareEmailSending", locale)
                    : t("content.shareEmailSend", locale)}
                </Button>
              </div>
              {emailState === "sent" && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-sage-dark">
                  <span
                    aria-hidden
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sage text-[10px] font-bold leading-none text-white"
                  >
                    ✓
                  </span>
                  {t("content.shareEmailSent", locale)}
                </p>
              )}
            </div>

            {/* Visszavonás */}
            <div className="border-t border-sand pt-4 text-center">
              <button
                type="button"
                onClick={() => void handleRevoke()}
                disabled={!shareUrl || busy}
                className="min-h-[44px] rounded-[10px] px-4 text-sm font-semibold text-[#8c4a31] transition hover:bg-[#fcf5ef] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("content.shareRevoke", locale)}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
