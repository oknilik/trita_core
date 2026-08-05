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
import { ShareCardDownload } from "@/components/results/ShareCardDownload";

type EmailState = "idle" | "sending" | "sent" | "error" | "invalid";

// Megosztás-kezelő modal: link létrehozás + vágólap-másolás inline
// visszajelzéssel (nincs böngésző-alert), opcionális email-küldés és
// visszavonás — mind egy helyen, a flow megszakítása nélkül.
// QR a modalban nincs: az email-küldés csatolja (szerver-oldali PNG) — a
// felület így két tiszta akcióra egyszerűsödik (másolás / küldés).
export interface ShareCardPreview {
  userName: string;
  personalityType: string;
  topDims: Array<{ label: string; score: number }>;
  /** Pontozott dimenziók a típus-ábrához — a megosztott lap fejlécével egyezően. */
  glyphDimensions?: Array<{ code: string; score: number }>;
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
  const previewGlyph = preview?.glyphDimensions
    ? resolveGlyphPair(preview.glyphDimensions)
    : null;

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

  const createLink = useCallback(async (): Promise<string | null> => {
    setBusy(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/profile/share", { method: "POST" });
      const data = await res.json();
      if (!data.token) throw new Error("NO_TOKEN");
      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrl(url);
      setRevoked(false);
      return url;
    } catch {
      setLoadError(true);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  // UX-B6: publikus linket csak az ELSŐ tényleges megosztási szándéknál
  // gyártunk (másolás/küldés) — a modal megnyitása önmagában ne írjon
  // shareTokent az adatbázisba.
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setEmailState("idle");
    }
  }, [isOpen]);

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
                <p className="text-micro uppercase tracking-widest text-white/[0.35]">
                  {t("results.sharedProfileLabel", locale)}
                </p>
                {/* A típus-ábra a név mellett — ugyanaz a kép, amit a link
                    megnyitója is látni fog a megosztott lap fejlécében. */}
                <div className="mt-1 flex items-center gap-3">
                  {previewGlyph && (
                    <TypeGlyph
                      primaryCode={previewGlyph.primaryCode}
                      secondaryCode={previewGlyph.secondaryCode}
                      typeLabel={preview.personalityType}
                      locale={locale === "hu" ? "hu" : "en"}
                      intensity={previewGlyph.intensity}
                      variant="badge"
                      className="h-11 w-11 shrink-0 rounded-lg border border-white/20"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-fraunces text-[17px] text-white">
                      {preview.userName}
                    </p>
                    <p className="font-fraunces text-body italic text-[var(--color-accent-primary-soft)]">
                      {preview.personalityType}
                    </p>
                  </div>
                </div>
                {preview.topDims.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {preview.topDims.map((d) => (
                      <span
                        key={d.label}
                        className="rounded-full bg-white/[0.12] px-2.5 py-1 text-micro font-medium text-white/[0.75]"
                      >
                        {d.label} {d.score}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* UX-B6b: őszinte lista arról, mi kerül ténylegesen a megosztott
                lapra — a kis preview-kártya ennél többet takar. */}
            {preview && (
              <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                {t("results.shareVisibleSummary", locale)}
              </p>
            )}

            {/* Link + másolás — a modal elsődleges akciója */}
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
                  className="min-h-[44px] w-full flex-1 truncate rounded-[10px] border border-sand bg-cream px-3 text-caption text-ink-body outline-none"
                />
                {/* Link nélkül is kattintható: az első másolás hozza létre
                    (vagy kéri vissza) a linket — a POST idempotens. */}
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
                  variant="secondary"
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
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-caption font-medium text-sage-dark">
                  <SuccessCheck />
                  {t("content.shareEmailSent", locale)}
                </p>
              )}
              {/* A QR a levélben utazik (szerver-oldali PNG-csatolmány) —
                  a modalból a látható QR-blokk ezért került ki. */}
              <p className="mt-1.5 text-micro text-muted">
                {t("content.shareEmailQrHint", locale)}
              </p>
            </div>

            {/* A3 lefokozva: a kártya-kép letöltése halk, másodlagos sor —
                kliens-oldali render, szerverre semmi nem megy. */}
            {preview && previewGlyph && (
              <ShareCardDownload
                userName={preview.userName}
                personalityType={preview.personalityType}
                topDims={preview.topDims.map((d) => ({ label: d.label, score: d.score }))}
                glyph={previewGlyph}
              />
            )}

            {/* Visszavonás */}
            <div className="border-t border-sand pt-4 text-center">
              {/* A DELETE szerver-oldalon minden élő tokent visszavon, így
                  korábbi munkamenetben létrehozott link is visszavonható
                  anélkül, hogy előbb meg kellene jeleníteni. */}
              <button
                type="button"
                onClick={() => void handleRevoke()}
                disabled={busy}
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
