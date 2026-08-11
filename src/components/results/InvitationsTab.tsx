"use client";

import { useState, useEffect } from "react";
import { isConsultingLed } from "@/lib/operating-mode";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { QrCodeBadge } from "@/components/ui/QrCodeBadge";
import { t, tf } from "@/lib/i18n";
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "@/lib/anonymity";
import { OBSERVER_INVITE_MAX_ACTIVE } from "@/lib/observer/invite-policy";
import type { SerializedSentInvitation, SerializedReceivedInvitation } from "@/components/profile/ProfileTabs";

interface InvitationsTabProps {
  sentInvitations: SerializedSentInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  isPlus: boolean;
  // Az összevetés-küszöb (OBSERVER_MIN_FOR_REVEAL = anonimitás-padló, n≥3) —
  // a hívó a szerver-oldali observer-flow értékét adja át; a default a
  // kanonikus padlóból jön (a korábbi kézi 2 a reveal-kapuval mondott
  // ellent: a banner „kész"-t ígért, az összevetés zárva maradt).
  minForReveal?: number;
  /** B14: szerver-oldalon ismert org-kontextus (observerFlow-ból) — a form
   *  címe és a picker-slot ettől függ, nem a kliens-fetch kimenetelétől,
   *  így a szekció nem címkézi át magát menet közben. */
  hasColleagueDirectory?: boolean;
}

// ─── Clipboard helper ────────────────────────────────────────────────────────

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fallback */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

// ─── Locked ──────────────────────────────────────────────────────────────────

function LockedInvitations() {
  const { locale } = useLocale();

  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-8 text-center">
      <span className="mb-2.5 inline-block text-[32px] opacity-20">🔒</span>
      <h3 className="mb-1.5 font-fraunces text-[18px] text-[var(--color-text-primary)]">
        {t("invitations.lockedTitle", locale)}
      </h3>
      <p className="mx-auto mb-4 max-w-[380px] text-caption leading-relaxed text-[var(--color-text-muted)]">
        {t("invitations.lockedSub", locale)}
      </p>
      {/* UX-B8: eddig onClick nélküli halott gomb volt — consulting-led
          konvenció szerint a /contact-ra visz. */}
      <a
        href="/contact"
        className="inline-flex min-h-[44px] items-center rounded-[10px] bg-[var(--color-accent-primary)] px-6 py-2.5 text-caption font-semibold text-[var(--color-text-on-accent)] transition hover:brightness-110"
      >
        {t("invitations.lockedCta", locale)}
      </a>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function InvitationsTab({
  sentInvitations,
  receivedInvitations,
  isPlus,
  minForReveal = MIN_RATERS_FOR_ANONYMOUS_AGGREGATE,
  hasColleagueDirectory = false,
}: InvitationsTabProps) {
  const { locale } = useLocale();
  const { showToast } = useToast();

  // ─── State & logic (create / copy / delete) ────────────────────────────────
  const [invitations, setInvitations] = useState(sentInvitations);
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // QR-nézet (workshop-helyzet): melyik függő meghívó linkjéhez mutatunk kódot.
  const [qrToken, setQrToken] = useState<string | null>(null);

  // Kollégalista (org-tagoknál) — csapattársak elöl, a szerver rendezi.
  // B14: a betöltés explicit állapot, hogy a felület ne „ugorjon össze"
  // menet közben — amíg tölt, skeleton tartja a picker helyét.
  const [colleagues, setColleagues] = useState<
    { userId: string; name: string; isTeammate: boolean; alreadyInvited: boolean }[]
  >([]);
  const [colleaguesLoading, setColleaguesLoading] = useState(true);
  const [colleagueSearch, setColleagueSearch] = useState("");
  const [invitingColleagueId, setInvitingColleagueId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/observer/colleagues")
      .then((res) => (res.ok ? res.json() : { colleagues: [] }))
      .then((data) => {
        if (!cancelled) setColleagues(data.colleagues ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setColleaguesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const active = invitations.filter((i) => i.status !== "CANCELED");
    const pendingCount = active.filter((i) => i.status === "PENDING").length;
    window.dispatchEvent(
      new CustomEvent("dashboard:invites-updated", {
        detail: { hasInvites: active.length > 0, pendingInvites: pendingCount },
      }),
    );
  }, [invitations]);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    const hasEmail = email.trim().length > 0;
    try {
      const res = await fetch("/api/observer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: hasEmail ? JSON.stringify({ email: email.trim() }) : JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = data.error ?? "";
        const loc = t(`error.${code}`, locale);
        setCreateError(loc !== `error.${code}` ? loc : t("invitations.errorGeneric", locale));
        return;
      }
      setInvitations((prev) => [{
        id: data.id, token: data.token, status: data.status ?? "PENDING",
        createdAt: new Date().toISOString(), completedAt: null,
        observerEmail: hasEmail ? email.trim() : null, observerName: null,
        observerType: data.observerType,
      }, ...prev]);
      if (data.awaitingApproval) {
        showToast(t("invitations.awaitingApprovalToast", locale), "info");
      } else if (hasEmail && !data.emailSent) {
        showToast(t("error.EMAIL_SEND_FAILED", locale), "info");
      }
      setEmail("");
    } catch {
      setCreateError(t("invitations.errorGeneric", locale));
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteColleague = async (colleagueUserId: string) => {
    if (invitingColleagueId) return;
    setInvitingColleagueId(colleagueUserId);
    setCreateError(null);
    try {
      const res = await fetch("/api/observer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colleagueUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = data.error ?? "";
        const loc = t(`error.${code}`, locale);
        setCreateError(loc !== `error.${code}` ? loc : t("invitations.errorGeneric", locale));
        return;
      }
      const colleague = colleagues.find((c) => c.userId === colleagueUserId);
      setInvitations((prev) => [{
        id: data.id, token: data.token, status: data.status ?? "PENDING",
        createdAt: new Date().toISOString(), completedAt: null,
        observerEmail: null, observerName: colleague?.name ?? null,
        observerType: data.observerType,
      }, ...prev]);
      setColleagues((prev) =>
        prev.map((c) => (c.userId === colleagueUserId ? { ...c, alreadyInvited: true } : c)),
      );
    } catch {
      setCreateError(t("invitations.errorGeneric", locale));
    } finally {
      setInvitingColleagueId(null);
    }
  };

  const handleCopy = async (token: string) => {
    const link = `${window.location.origin}/observe/${token}`;
    const ok = await copyText(link);
    if (!ok) { showToast(t("invitations.copyFailed", locale), "error"); return; }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/observer/invite/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      showToast(t("invitations.deleteFailed", locale), "error");
    } finally {
      setDeletingId(null);
    }
  };

  // A) LOCKED
  if (!isPlus) {
    return <LockedInvitations />;
  }

  const active = invitations.filter((i) => i.status !== "CANCELED");
  const completed = active.filter((i) => i.status === "COMPLETED");
  const pending = active.filter(
    (i) => i.status === "PENDING" || i.status === "AWAITING_APPROVAL",
  );
  // A kvóta CSAK a függő (PENDING/AWAITING_APPROVAL) meghívókra vonatkozik —
  // ugyanaz, amit a szerver számol (invite/route.ts): a KITÖLTÖTT nem fogyaszt
  // keretet. A korábbi `active.length` a completed-et is beleszámolta, így 5
  // kitöltött után a felhasználó nem tudott új visszajelzést kérni, holott a
  // szerver elfogadta volna.
  const canCreate = pending.length < OBSERVER_INVITE_MAX_ACTIVE;

  const typeBadge = (observerType?: string): string | null => {
    switch (observerType) {
      case "TEAM": return t("invitations.typeTeam", locale);
      case "ORG": return t("invitations.typeOrg", locale);
      case "EXTERNAL": return t("invitations.typeExternal", locale);
      case "INTERNAL": return t("invitations.typePersonal", locale);
      default: return null;
    }
  };

  const filteredColleagues = colleagues.filter((c) =>
    c.name.toLowerCase().includes(colleagueSearch.trim().toLowerCase()),
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "hu" ? "hu-HU" : "en-GB", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
          <span className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("invitations.eyebrow", locale)}
          </span>
        </div>
        <h2 className="font-fraunces text-[22px] tracking-tight text-[var(--color-text-primary)]">
          {t("invitations.title", locale)}
        </h2>
        <p className="mt-1 max-w-[480px] text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("invitations.sub", locale)}
        </p>
      </div>

      {/* 2. Stat cells */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-3.5 text-center">
          <p className="font-fraunces text-2xl" style={{ color: completed.length > 0 ? "var(--color-action-primary-bg)" : "var(--color-text-primary)" }}>
            {completed.length}
          </p>
          <p className="text-micro text-[var(--color-text-muted)]">{t("invitations.statReceived", locale)}</p>
        </div>
        <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-3.5 text-center">
          <p className="font-fraunces text-2xl" style={{ color: pending.length > 0 ? "var(--color-accent-primary)" : "var(--color-text-primary)" }}>
            {pending.length}
          </p>
          <p className="text-micro text-[var(--color-text-muted)]">{t("invitations.statPending", locale)}</p>
        </div>
        <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-3.5 text-center">
          <p className="font-fraunces text-2xl text-[var(--color-text-primary)]">{active.length}</p>
          <p className="text-micro text-[var(--color-text-muted)]">{t("invitations.statSent", locale)}</p>
        </div>
      </div>

      {/* 3. Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl border-[1.5px] border-[var(--color-action-primary-bg)]/15 bg-[var(--color-surface-self-accent-soft)] p-3.5 px-4">
        <span className="shrink-0 text-sm" style={{ color: "var(--color-action-primary-bg)" }}>
          {completed.length >= minForReveal ? "✓" : "ℹ"}
        </span>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-accent-self-deep)" }}>
          {completed.length >= minForReveal
            ? `${completed.length} ${t("invitations.infoReady", locale)}`
            : tf("invitations.infoNeededN", locale, { min: minForReveal })}
        </p>
      </div>

      {/* 4a. Kolléga-picker (org-tagoknál) — B14: org-kontextusban a fetch
          alatt skeleton tartja a helyét, hogy a lenti form ne ugorjon el;
          nem org-tagnál (hasColleagueDirectory=false) skeleton sincs. */}
      {hasColleagueDirectory && colleaguesLoading && canCreate ? (
        <div
          aria-hidden="true"
          className="animate-pulse rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-[18px] px-5"
        >
          <div className="h-4 w-48 max-w-full rounded bg-[var(--color-surface-subtle)]" />
          <div className="mt-2 h-3 w-72 max-w-full rounded bg-[var(--color-surface-subtle)]" />
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="h-12 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-canvas)]" />
            <div className="h-12 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-canvas)]" />
          </div>
        </div>
      ) : colleagues.length > 0 && canCreate ? (
        <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-[18px] px-5">
          <p className="text-caption font-semibold text-[var(--color-text-primary)]">
            + {t("invitations.colleagueSectionTitle", locale)}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {t("invitations.colleagueSectionHint", locale)}
          </p>
          {colleagues.length > 6 ? (
            <input
              type="text"
              value={colleagueSearch}
              onChange={(e) => setColleagueSearch(e.target.value)}
              placeholder={t("invitations.colleagueSearchPlaceholder", locale)}
              className="mt-3 min-h-[44px] w-full rounded-[10px] border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-canvas)] px-3.5 py-2 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-action-primary-bg)] focus:outline-none md:min-h-[40px] md:text-caption"
            />
          ) : null}
          <div className="mt-3 flex max-h-[260px] flex-col gap-1.5 overflow-y-auto">
            {filteredColleagues.length === 0 ? (
              <p className="py-2 text-center text-[12px] text-[var(--color-text-muted)]">
                {t("invitations.colleagueEmpty", locale)}
              </p>
            ) : (
              filteredColleagues.map((c) => (
                <div
                  key={c.userId}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-canvas)] px-3 py-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-self-accent-soft)] text-[12px] font-bold text-[var(--color-action-primary-bg)]">
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-caption font-medium text-[var(--color-text-primary)]">
                    {c.name}
                  </span>
                  {c.isTeammate ? (
                    <span className="shrink-0 rounded-full bg-[var(--color-surface-self-accent-soft)] px-2 py-0.5 text-micro font-semibold uppercase tracking-wide text-[var(--color-action-primary-bg)]">
                      {t("invitations.colleagueTeammateBadge", locale)}
                    </span>
                  ) : null}
                  {c.alreadyInvited ? (
                    <span className="shrink-0 text-[11px] text-[var(--color-text-muted)]">
                      {t("invitations.colleagueInvitedBadge", locale)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInviteColleague(c.userId)}
                      disabled={invitingColleagueId !== null}
                      className="inline-flex min-h-[40px] shrink-0 items-center rounded-lg bg-[var(--color-action-primary-bg)] px-3.5 py-1 text-[11px] font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-[var(--color-sage-dark)] disabled:opacity-50 md:min-h-[32px]"
                    >
                      {invitingColleagueId === c.userId ? "…" : t("invitations.colleagueInviteButton", locale)}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* 4. Create form — B14: a cím a szerver-oldalon ismert org-kontextusból
          jön (hasColleagueDirectory prop), nem a kolléga-fetch kimenetelétől,
          így a szekció nem címkézi át magát menet közben. */}
      <div className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-[18px] px-5">
        <p className="mb-3 text-caption font-semibold text-[var(--color-text-primary)]">
          + {hasColleagueDirectory
            ? t("invitations.externalSectionTitle", locale)
            : t("invitations.formTitle", locale)}
        </p>
        {hasColleagueDirectory ? (
          <p className="-mt-1 mb-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {t("invitations.externalApprovalHint", locale)}
          </p>
        ) : null}

        {canCreate ? (
          <>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder={t("invitations.formPlaceholder", locale)}
                className="min-h-[44px] min-w-0 flex-1 rounded-[10px] border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-canvas)] px-3.5 py-2.5 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-action-primary-bg)] focus:outline-none md:text-caption"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="min-h-[44px] shrink-0 rounded-[10px] bg-[var(--color-action-primary-bg)] px-5 py-2.5 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-[var(--color-sage-dark)] disabled:opacity-50"
              >
                {isCreating ? "..." : t("invitations.formSubmit", locale)}
              </button>
            </div>
            {createError && (
              <p className="mt-2 text-xs text-[var(--color-accent-primary-strong)]">{createError}</p>
            )}
            <div className="mt-2.5 flex flex-col gap-1">
              <span className="text-[11px] text-[var(--color-text-muted)]">
                🔗 {t("invitations.formHintLink", locale)}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                📧 {t("invitations.formHintEmail", locale)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-caption text-[var(--color-text-muted)]">
            {t("invitations.limitReached", locale)}
          </p>
        )}
      </div>

      {/* 5. Invitation list or empty state */}
      {active.length === 0 ? (
        <div className="rounded-xl border-[1.5px] border-dashed border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-9 text-center">
          <span className="mb-2 inline-block text-[28px] opacity-25" style={{ color: "var(--color-text-muted)" }}>👥</span>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            {t("invitations.emptyTitle", locale)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t("invitations.emptySub", locale)}
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[11px] leading-relaxed text-[var(--color-ink-warm)]">
            {locale === "hu"
              ? "A következő lépésed: indíts observer kört, majd kapcsolódj csapathoz, hogy a személyes insightból közös csapatkép legyen."
              : "Your next step: start an observer round, then connect to a team to turn self insight into a shared team picture."}
          </p>
          <div className="mt-3">
            <Link
              href={isConsultingLed() ? "/contact" : "/onboarding?intent=team"}
              className="inline-flex min-h-[40px] items-center rounded-[10px] border border-[var(--color-warm-dark)] bg-surface-card px-4 text-[11px] font-semibold text-[var(--color-bronze-700)] transition hover:bg-[var(--color-bronze-100)]"
            >
              {isConsultingLed()
                ? (locale === "hu" ? "Beszéljünk a csapatodról" : "Talk to us about your team")
                : (locale === "hu" ? "Csapat út megnyitása" : "Open team path")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Completed group.
              W1 (differencia-támadás maradék felülete): ez a lista a meghívó
              (értékelt) SAJÁT meghívóit mutatja névvel + nap-pontos dátummal —
              ez szándékos (tudnod kell, kit hívtál és ki válaszolt). A
              maradék kockázat NEM itt van, hanem az összevetés-nézet futó
              observer-átlagában, ami minden betöltéskor újraszámol: egy
              elszánt értékelt a k. és (k−1). állapot különbségéből visszafejtheti
              az utolsó értékelő vektorát, és a nevesített listával névhez kötheti.
              Mitigáció (kész): a completion-értesítés anonim (submit/route.ts),
              a reveal csak n≥3-nál nyílik, a dátum nap-pontos (nincs sorrendi
              idő-finomság). Teljes zárás = zajos/kvantált aggregátum — ez
              pilot-kalibrációt igényel (ld. results reveal-küszöb jegyzet). */}
          {completed.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {`${t("invitations.groupReceived", locale)} (${completed.length})`}
              </p>
              {completed.map((inv) => (
                <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card px-4 py-3.5 transition-all hover:border-[var(--color-action-primary-bg)]/30 hover:shadow-sm">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm" style={{ backgroundColor: "var(--color-surface-self-accent-soft)", color: "var(--color-action-primary-bg)" }}>✓</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-medium text-[var(--color-text-primary)]">
                      {inv.observerName ?? inv.observerEmail ?? t("invitations.linkInvite", locale)}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {t("invitations.receivedLabel", locale)}: {formatDate(inv.completedAt ?? inv.createdAt)}
                      {typeBadge(inv.observerType)
                        ? <>{" · "}{typeBadge(inv.observerType)}</>
                        : <>{" · "}{inv.observerEmail ? t("invitations.emailInvite", locale) : t("invitations.linkInvite", locale)}</>}
                    </p>
                  </div>
                  <span className="rounded px-2 py-0.5 text-micro font-semibold" style={{ backgroundColor: "var(--color-surface-self-accent-soft)", color: "var(--color-accent-self-deep)" }}>
                    {t("invitations.statusCompleted", locale)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending group */}
          {pending.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {`${t("invitations.groupPending", locale)} (${pending.length})`}
              </p>
              {pending.map((inv) => (
                <div key={inv.id} className="mb-2">
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card px-4 py-3.5 transition-all hover:border-[var(--color-accent-primary)]/30 hover:shadow-sm">
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm" style={{ backgroundColor: inv.observerEmail || inv.observerName ? "var(--color-surface-highlight-warm)" : "var(--color-surface-subtle)", color: inv.observerEmail || inv.observerName ? "var(--color-accent-primary)" : "var(--color-text-muted)" }}>
                      {inv.status === "AWAITING_APPROVAL" ? "🔒" : inv.observerEmail || inv.observerName ? "⏳" : "🔗"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-caption font-medium text-[var(--color-text-primary)]">
                        {inv.observerName ?? inv.observerEmail ?? t("invitations.linkInvite", locale)}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {t("invitations.sentLabel", locale)}: {formatDate(inv.createdAt)}
                        {typeBadge(inv.observerType)
                          ? <>{" · "}{typeBadge(inv.observerType)}</>
                          : <>{" · "}{inv.observerEmail ? t("invitations.emailInvite", locale) : t("invitations.linkInvite", locale)}</>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-micro font-semibold" style={{ backgroundColor: "var(--color-surface-highlight-warm)", color: "var(--color-accent-primary-strong)" }}>
                        {inv.status === "AWAITING_APPROVAL"
                          ? t("invitations.statusAwaitingApproval", locale)
                          : t("invitations.statusPending", locale)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(inv.token)}
                        className="inline-flex min-h-[40px] items-center rounded-lg border border-[var(--color-border-soft)] bg-surface-card px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-subtle)] md:min-h-[32px]"
                      >
                        {copiedToken === inv.token ? t("invitations.copied", locale) : t("invitations.linkButton", locale)}
                      </button>
                      {/* QR — workshop-helyzet: a meghívott a teremben, a
                          telefonjával olvassa be a linket. */}
                      <button
                        type="button"
                        onClick={() => setQrToken((prev) => (prev === inv.token ? null : inv.token))}
                        aria-expanded={qrToken === inv.token}
                        className="inline-flex min-h-[40px] items-center rounded-lg border border-[var(--color-border-soft)] bg-surface-card px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-subtle)] md:min-h-[32px]"
                      >
                        QR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id)}
                        disabled={deletingId === inv.id}
                        aria-label={t("actions.delete", locale)}
                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[var(--color-border-soft)] bg-surface-card px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-subtle)] disabled:opacity-50 md:min-h-[32px] md:min-w-0"
                      >
                        {deletingId === inv.id ? "..." : "✕"}
                      </button>
                    </div>
                  </div>
                  {qrToken === inv.token ? (
                    <QrCodeBadge
                      value={`/observe/${inv.token}`}
                      alt={t("invitations.qrAlt", locale)}
                      hint={t("invitations.qrHint", locale)}
                      onError={() => showToast(t("invitations.errorGeneric", locale), "error")}
                      className="mt-2"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Received invitations (where others invited this user) */}
      {receivedInvitations.length > 0 && (
        <div className="border-t border-[var(--color-border-soft)] pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t("invitations.receivedSection", locale)}
          </p>
          {receivedInvitations.map((inv) => {
            const name = inv.inviterUsername ?? t("invitations.anonymous", locale);
            const isPending = inv.status === "PENDING";
            const isExpired = new Date(inv.expiresAt) < new Date();
            const isDone = inv.status === "COMPLETED";

            return (
              <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card px-4 py-3.5">
                <div
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ backgroundColor: isDone ? "var(--color-surface-self-accent-soft)" : "var(--color-surface-subtle)", color: isDone ? "var(--color-action-primary-bg)" : "var(--color-text-muted)" }}
                >
                  {isDone ? "✓" : "📩"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-caption font-medium text-[var(--color-text-primary)]">{name}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {isDone
                      ? t("invitations.statusCompleted", locale)
                      : inv.status === "CANCELED"
                        ? t("invitations.statusCanceled", locale)
                        : isExpired
                          ? t("invitations.statusExpired", locale)
                          : t("invitations.statusPendingLower", locale)}
                  </p>
                </div>
                {isPending && !isExpired && (
                  <Link href={`/observe/${inv.token}`} className="min-h-[44px] shrink-0 rounded-[10px] bg-[var(--color-action-primary-bg)] px-4 py-2 text-[11px] font-semibold text-[var(--color-action-primary-fg)]">
                    {t("invitations.fillIn", locale)}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
