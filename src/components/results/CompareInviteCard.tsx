"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { QrCodeBadge } from "@/components/ui/QrCodeBadge";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

export interface SerializedCompareInvite {
  id: string;
  token: string | null;
  state: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  role: "inviter" | "partner";
  otherName: string | null;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string;
}

interface CompareInviteCardProps {
  invites: SerializedCompareInvite[];
}

/**
 * „Összehasonlítás valódi kollégával" — link-kezelő kártya az interakció-
 * oldalon: link készítés, másolás, visszavonás, elfogadott párok megnyitása.
 * Mutáció után router.refresh() (repo-konvenció); a lista a szerverről jön.
 */
export function CompareInviteCard({ invites }: CompareInviteCardProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // QR-nézet (workshop-dramaturgia): melyik PENDING linkhez mutatunk kódot.
  const [qrForId, setQrForId] = useState<string | null>(null);
  // Opcionális email-küldés link-készítéskor.
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const qrInvite = qrForId
    ? (invites.find((inv) => inv.id === qrForId && inv.token) ?? null)
    : null;

  const visibleInvites = invites.filter(
    (inv) => inv.state === "PENDING" || inv.state === "ACCEPTED",
  );

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const trimmedEmail = email.trim();
      const res = await fetch("/api/interaction/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedEmail ? { email: trimmedEmail } : {}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          data?.error === "COMPARE_LIMIT_REACHED"
            ? t("results.compareLimitError", locale)
            : t("results.compareError", locale),
        );
        return;
      }
      if (trimmedEmail) {
        setNotice(
          data?.emailSent
            ? t("results.compareEmailSent", locale)
            : t("results.compareEmailFailed", locale),
        );
        if (data?.emailSent) setEmail("");
      }
      router.refresh();
    } catch {
      setError(t("results.compareError", locale));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async (inv: SerializedCompareInvite) => {
    if (!inv.token) return;
    const url = `${window.location.origin}/interaction/compare/${inv.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(inv.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError(t("results.compareError", locale));
    }
  };

  const handleRevoke = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/interaction/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setError(t("results.compareError", locale));
        return;
      }
      router.refresh();
    } catch {
      setError(t("results.compareError", locale));
    } finally {
      setBusy(false);
    }
  };

  const stateLabel = (state: SerializedCompareInvite["state"]) =>
    state === "ACCEPTED"
      ? t("results.compareStateAccepted", locale)
      : state === "PENDING"
        ? t("results.compareStatePending", locale)
        : state === "EXPIRED"
          ? t("results.compareStateExpired", locale)
          : t("results.compareStateRevoked", locale);

  return (
    <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
      <SectionEyebrow tone="muted">
        {t("results.compareCardTitle", locale)}
      </SectionEyebrow>
      <p className="mt-2 max-w-prose text-caption leading-relaxed text-ink-body">
        {t("results.compareCardBody", locale)}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("results.compareEmailPlaceholder", locale)}
          className="min-h-[44px] w-full flex-1 rounded-[10px] border border-sand bg-cream px-3 text-caption text-ink-body outline-none focus:border-[var(--color-accent-primary)]/50"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-5 text-caption font-bold text-white transition-all hover:-translate-y-px hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("results.compareCreateCta", locale)}
        </button>
      </div>
      <p className="mt-2 text-micro text-muted">
        {t("results.compareLimitNote", locale)}{" "}
        {t("results.compareEmailOptionalNote", locale)}
      </p>

      {notice ? (
        <p className="mt-3 rounded-lg border border-sand bg-cream/60 px-3 py-2 text-xs text-ink-body">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {visibleInvites.length === 0 ? (
          <p className="text-caption text-muted">
            {t("results.compareListEmpty", locale)}
          </p>
        ) : (
          visibleInvites.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-sand bg-cream/45 px-3 py-2.5"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-micro font-semibold ${
                  inv.state === "ACCEPTED"
                    ? "bg-sage/15 text-sage-dark"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {stateLabel(inv.state)}
              </span>
              <span className="min-w-0 flex-1 truncate text-caption text-ink-body">
                {inv.state === "ACCEPTED"
                  ? (inv.otherName ?? t("results.comparePartnerFallback", locale))
                  : new Date(inv.createdAt).toLocaleDateString(
                      locale === "hu" ? "hu-HU" : "en-GB",
                    )}
              </span>
              {inv.state === "ACCEPTED" ? (
                <Link
                  href={`/interaction?pair=${inv.id}`}
                  className="inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
                >
                  {t("results.compareOpenPair", locale)}
                </Link>
              ) : null}
              {inv.state === "PENDING" && inv.token ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCopy(inv)}
                    className="inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
                  >
                    {copiedId === inv.id
                      ? t("results.compareCopied", locale)
                      : t("results.compareCopy", locale)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrForId(qrForId === inv.id ? null : inv.id)}
                    aria-expanded={qrForId === inv.id}
                    className="inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
                  >
                    QR
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => handleRevoke(inv.id)}
                disabled={busy}
                className="inline-flex min-h-[38px] items-center rounded-[10px] px-3 text-[12px] font-medium text-muted transition-colors hover:text-rose-700 disabled:opacity-50"
              >
                {t("results.compareRevoke", locale)}
              </button>
            </div>
          ))
        )}
      </div>

      {/* QR — személyes/workshop helyzetre: a másik fél a telefonjával
          olvassa be, és egyből a consent-oldalra jut. */}
      {qrInvite?.token ? (
        <QrCodeBadge
          value={`/interaction/compare/${qrInvite.token}`}
          alt={t("results.compareQrAlt", locale)}
          hint={t("results.compareQrHint", locale)}
          onError={() => setError(t("results.compareError", locale))}
          className="mt-4"
        />
      ) : null}
    </section>
  );
}
