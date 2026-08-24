"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { QrCodeBadge } from "@/components/ui/QrCodeBadge";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface SerializedCompareInvite {
  id: string;
  token: string | null;
  state: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  role: "inviter" | "partner";
  otherName: string | null;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string;
  otherGlyph: {
    primaryCode: string;
    secondaryCode: string;
    intensity: number;
    label: string;
  } | null;
}

interface CompareInviteCardProps {
  invites: SerializedCompareInvite[];
}

/**
 * Valódi személyek link-kezelője az interakció-oldalon: link készítés,
 * másolás, visszavonás, elfogadott párok megnyitása.
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
  // Visszavonás előtti megerősítés: melyik sor kérdezett rá. A művelet a
  // másik fél számára is megszünteti a közös képet — nem egy kattintás.
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const qrInvite = qrForId
    ? (invites.find((inv) => inv.id === qrForId && inv.token) ?? null)
    : null;

  const acceptedInvites = invites.filter((inv) => inv.state === "ACCEPTED");
  const pendingInvites = invites.filter((inv) => inv.state === "PENDING");
  // Akinek még egyáltalán nincs kapcsolata, annak a meghívás NEM másodlagos
  // művelet: az az egyetlen értelmes következő lépés, tehát nyitva indul.
  const hasAnyConnection =
    acceptedInvites.length > 0 || pendingInvites.length > 0;
  const [inviteExpanded, setInviteExpanded] = useState(!hasAnyConnection);

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
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* Nulla kapcsolatnál a „Válassz a kapcsolataid közül" cím
              értelmetlen — ott a meghívás maga a feladat. */}
          <h2 className="font-fraunces text-title leading-tight text-[var(--color-text-primary)] sm:text-title">
            {hasAnyConnection
              ? t("results.compareConnectionsTitle", locale)
              : t("results.compareConnectionsEmptyTitle", locale)}
          </h2>
          <p className="mt-1 text-caption text-[var(--color-text-muted)]">
            {hasAnyConnection
              ? t("results.compareConnectionsBody", locale)
              : t("results.compareConnectionsEmptyBody", locale)}
          </p>
        </div>
        {acceptedInvites.length > 0 ? (
          <p className="flex shrink-0 items-center gap-2 text-micro font-medium text-[var(--color-accent-self-deep)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-self-deep)]" />
            {tf("results.compareConnectionsReady", locale, {
              count: acceptedInvites.length,
            })}
          </p>
        ) : null}
      </div>

      <div className={acceptedInvites.length > 0 ? "mt-5 flex flex-col gap-3" : ""}>
        {acceptedInvites.length === 0 ? (
          // Ha van kiküldött link, akkor NEM igaz, hogy „nincs aktív linked" —
          // az a lista közvetlenül alább ott van. Nulla kapcsolatnál pedig
          // egyáltalán nem kell placeholder: a nyitott meghívó-blokk a tartalom.
          pendingInvites.length > 0 ? (
            <p className="mt-5 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-5 text-caption text-[var(--color-text-muted)]">
              {t("results.compareListPendingOnly", locale)}
            </p>
          ) : null
        ) : (
          acceptedInvites.map((inv) => {
            const otherName =
              inv.otherName ?? t("results.comparePartnerFallback", locale);
            return (
              <article
                key={inv.id}
                className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4 sm:flex-row sm:items-center"
              >
                {inv.otherGlyph ? (
                  <TypeGlyph
                    primaryCode={inv.otherGlyph.primaryCode}
                    secondaryCode={inv.otherGlyph.secondaryCode}
                    typeLabel={inv.otherGlyph.label}
                    locale={locale === "hu" ? "hu" : "en"}
                    intensity={inv.otherGlyph.intensity}
                    variant="badge"
                    className="h-16 w-16 shrink-0 rounded-xl bg-[var(--color-surface-highlight-warm)]"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-highlight-warm)] font-fraunces text-xl text-[var(--color-accent-primary-strong)]">
                    {otherName.slice(0, 1).toLocaleUpperCase(locale)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-fraunces text-heading text-[var(--color-text-primary)]">
                      {otherName}
                    </h3>
                    <span className="flex items-center gap-1.5 text-micro font-medium text-[var(--color-accent-self-deep)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {stateLabel(inv.state)}
                    </span>
                  </div>
                  {inv.otherGlyph ? (
                    <p className="mt-1 text-caption text-[var(--color-text-secondary)]">
                      {inv.otherGlyph.label}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link
                    href={`/interaction?pair=${inv.id}`}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent-primary)] px-4 text-caption font-semibold text-[var(--color-text-on-accent)] transition-all hover:-translate-y-px hover:brightness-[1.06] sm:flex-none"
                  >
                    {t("results.compareOpenPair", locale)}
                    <ChevronRightIcon />
                  </Link>
                  {/* Két lépés: a visszavonás a MÁSIK félnél is megszünteti a
                      közös képet, és közvetlenül a primary CTA mellett áll. */}
                  {confirmRevokeId === inv.id ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-micro text-[var(--color-text-muted)]">
                        {t("results.compareRevokeConfirmQuestion", locale)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmRevokeId(null);
                          void handleRevoke(inv.id);
                        }}
                        disabled={busy}
                        className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-micro font-semibold text-state-error-fg transition-colors hover:underline disabled:opacity-50"
                      >
                        {t("results.compareRevokeConfirmYes", locale)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRevokeId(null)}
                        className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-micro font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                      >
                        {t("results.compareRevokeConfirmNo", locale)}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRevokeId(inv.id)}
                      disabled={busy}
                      className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-micro font-medium text-[var(--color-text-muted)] transition-colors hover:text-state-error-fg disabled:opacity-50"
                    >
                      {t("results.compareRevoke", locale)}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-[var(--color-border-default)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="10" cy="8" r="3" />
              <path d="M4 19a6 6 0 0 1 12 0M18 7v6M15 10h6" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-fraunces text-heading text-[var(--color-text-primary)]">
              {hasAnyConnection
                ? t("results.compareInvitePromptTitle", locale)
                : t("results.compareInviteFirstTitle", locale)}
            </p>
            <p className="mt-0.5 text-micro leading-relaxed text-[var(--color-text-muted)]">
              {t("results.compareInvitePromptBody", locale)}
            </p>
          </div>
          {/* Nulla kapcsolatnál nincs mire visszacsukni: a toggle csak zaj. */}
          {hasAnyConnection ? (
            <button
              type="button"
              onClick={() => setInviteExpanded((current) => !current)}
              aria-expanded={inviteExpanded}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-surface-card px-4 text-caption font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
            >
              {inviteExpanded
                ? t("results.compareInviteHide", locale)
                : t("results.compareInviteToggle", locale)}
            </button>
          ) : null}
        </div>

        {inviteExpanded ? (
          <div className="mt-4 border-t border-[var(--color-border-soft)] pt-4">
            <p className="max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
              {t("results.compareCardBody", locale)}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("results.compareEmailPlaceholder", locale)}
                className="min-h-[44px] w-full min-w-0 flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-3 text-base text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent-primary)]/50 md:text-caption"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-5 text-caption font-bold text-[var(--color-text-on-accent)] transition-all hover:-translate-y-px hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("results.compareCreateCta", locale)}
              </button>
            </div>
            <p className="mt-2 text-micro text-[var(--color-text-muted)]">
              {t("results.compareLimitNote", locale)}{" "}
              {t("results.compareEmailOptionalNote", locale)}
            </p>
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="mt-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-state-error-border bg-state-error-bg px-3 py-2 text-xs text-state-error-fg">
          {error}
        </p>
      ) : null}

      {pendingInvites.length > 0 ? (
        <div className="mt-5 border-t border-[var(--color-border-soft)] pt-5">
          <h3 className="text-label uppercase text-[var(--color-text-muted)]">
            {t("results.comparePendingTitle", locale)}
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2.5"
              >
                <span className="rounded-full bg-state-warning-bg px-2 py-0.5 text-micro font-semibold text-state-warning-fg">
                  {stateLabel(inv.state)}
                </span>
                <span className="min-w-0 flex-1 text-caption text-[var(--color-text-secondary)]">
                  {new Date(inv.createdAt).toLocaleDateString(
                    locale === "hu" ? "hu-HU" : "en-GB",
                  )}
                </span>
                {inv.token ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopy(inv)}
                      className="inline-flex min-h-[38px] items-center rounded-[10px] bg-surface-card px-3 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-highlight-warm)]"
                    >
                      {copiedId === inv.id
                        ? t("results.compareCopied", locale)
                        : t("results.compareCopy", locale)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrForId(qrForId === inv.id ? null : inv.id)}
                      aria-expanded={qrForId === inv.id}
                      className="inline-flex min-h-[38px] items-center rounded-[10px] bg-surface-card px-3 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-highlight-warm)]"
                    >
                      QR
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleRevoke(inv.id)}
                  disabled={busy}
                  className="inline-flex min-h-[38px] items-center rounded-[10px] px-3 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-state-error-fg disabled:opacity-50"
                >
                  {t("results.compareRevoke", locale)}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
