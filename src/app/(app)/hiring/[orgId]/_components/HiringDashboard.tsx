"use client";

import { useState } from "react";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";
import { CandidateRevokeButton } from "@/components/manager/CandidateRevokeButton";
import { RequestCreditsButton } from "@/components/hiring/RequestCreditsButton";
import { Button, getButtonClassName } from "@/components/ui/primitives/Button";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
} from "@/components/dashboard/DashboardPrimitives";
import { EmptyState } from "@/components/ui/primitives/EmptyState";

// ─────────────────────────────────────────────────────────────────────
// Tanácsadói jelölt-kezelő (2026-08-05 vizuális frissítés): a self/team
// felületek mintája — SurfaceHero (candidate/terrakotta variáns) +
// DashboardPanel/DashboardMetricCard — a korábbi kézi kártyák helyett.
// A viselkedés (invite-toggle, resend, revoke, kredit-gomb) változatlan.
// ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
}

interface SerializedInvite {
  id: string;
  email: string | null;
  name: string | null;
  position: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  teamId: string | null;
  teamName: string | null;
  hasResult: boolean;
  draftAnsweredCount: number;
  totalQuestions: number;
}

interface CreditBalance {
  available: number;
  totalPurchased: number;
  totalUsed: number;
}


interface HiringDashboardProps {
  orgId: string;
  orgName: string;
  teams: Team[];
  invites: SerializedInvite[];
  locale: Locale;
  planTier: string;
  creditBalance: CreditBalance | null;
  canInviteNew: boolean;
  isAdmin: boolean;
}

function statusLabel(status: string, isExpired: boolean, locale: Locale, draftAnsweredCount?: number): string {
  if (isExpired) return t("hiring.statusExpired", locale);
  switch (status) {
    case "COMPLETED": return t("hiring.statusCompleted", locale);
    case "CANCELED": return t("hiring.statusCanceled", locale);
    default:
      if ((draftAnsweredCount ?? 0) > 0) return t("hiring.statusInProgress", locale);
      return t("hiring.statusSent", locale);
  }
}

// Státusz-chip: a folyamatban lévő állapot a felület terrakotta akcentjét
// kapja; a lezárt/hiba állapotok a szemantikus state-tokeneket.
function statusClass(status: string, isExpired: boolean, draftAnsweredCount?: number): string {
  if (isExpired || status === "EXPIRED") return "bg-sand text-ink-body/60";
  if (status === "COMPLETED") return "bg-state-success-bg text-state-success-fg";
  if (status === "CANCELED") return "bg-state-error-bg text-state-error-fg";
  if ((draftAnsweredCount ?? 0) > 0) return "bg-accent-candidate-soft text-accent-candidate-strong";
  return "bg-cream text-ink-body";
}

function CandidateRow({
  invite,
  orgId,
  locale,
  dateLocale,
}: {
  invite: SerializedInvite;
  orgId: string;
  locale: Locale;
  dateLocale: string;
}) {
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent">("idle");

  const isExpired =
    invite.status === "PENDING" && new Date(invite.expiresAt) < new Date();

  const displayName =
    invite.name ?? invite.email ?? t("hiring.unnamedCandidate", locale);
  const initial = displayName[0]?.toUpperCase() ?? "?";

  async function handleResend() {
    setResendState("loading");
    try {
      const res = await fetch(`/api/manager/candidates/${invite.id}/resend`, { method: "POST" });
      setResendState(res.ok ? "sent" : "idle");
    } catch {
      setResendState("idle");
    }
  }

  return (
    <div className="rounded-2xl border border-sand bg-white px-4 py-3 shadow-[0_10px_26px_rgba(26,26,46,0.03)] transition-shadow hover:shadow-[0_12px_30px_rgba(26,26,46,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-candidate-soft text-[11px] font-bold text-accent-candidate-strong">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption font-semibold text-ink">
            {displayName}
          </p>
          <p className="truncate text-[11px] text-muted">
            {invite.position && `${invite.position} · `}
            {invite.teamName && `${invite.teamName} · `}
            {new Date(invite.createdAt).toLocaleDateString(dateLocale)}
          </p>
          {invite.status === "PENDING" && !isExpired && invite.draftAnsweredCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-warm-mid">
                <div
                  className="h-full rounded-full bg-accent-candidate-mid"
                  style={{
                    width: `${Math.min(100, Math.round((invite.draftAnsweredCount / invite.totalQuestions) * 100))}%`,
                  }}
                />
              </div>
              <span className="shrink-0 font-mono text-micro text-muted">
                {invite.draftAnsweredCount}/{invite.totalQuestions}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sand/80 pt-2.5">
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-0.5 text-micro font-semibold",
            statusClass(invite.status, isExpired, invite.draftAnsweredCount),
          ].join(" ")}
        >
          {statusLabel(invite.status, isExpired, locale, invite.draftAnsweredCount)}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {invite.status === "COMPLETED" && invite.hasResult && (
            <Link
              href={`/hiring/${orgId}/candidates/${invite.id}`}
              className={getButtonClassName({
                variant: "secondary",
                size: "sm",
                className: "px-3 text-[11px]",
              })}
            >
              {t("hiring.resultsLink", locale)}
            </Link>
          )}
          {invite.status === "PENDING" && !isExpired && !!invite.email && (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resendState !== "idle"}
              className={`min-h-[36px] inline-flex items-center rounded-lg border px-3 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                resendState === "sent"
                  ? "border-state-success-border bg-state-success-bg text-state-success-fg"
                  : "border-sand bg-white text-ink-body hover:border-accent-candidate-border hover:text-accent-candidate"
              }`}
            >
              {resendState === "loading"
                ? "…"
                : resendState === "sent"
                ? t("hiring.resendSent", locale)
                : t("hiring.resendButton", locale)}
            </button>
          )}
          {invite.status === "PENDING" && !isExpired && (
            <CandidateRevokeButton inviteId={invite.id} isHu={locale !== "en"} />
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateSection({
  label,
  description,
  count,
  countClass,
  children,
}: {
  label: string;
  description: string;
  count: number;
  countClass: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardPanel className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <DashboardSectionHeader label={label} />
          <p className="mt-1.5 text-[12px] text-ink-body">{description}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-micro font-semibold ${countClass}`}>
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </DashboardPanel>
  );
}

export function HiringDashboard({
  orgId,
  orgName,
  teams,
  invites,
  locale,
  planTier,
  creditBalance,
  canInviteNew,
  isAdmin,
}: HiringDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";
  const isHu = locale !== "en";
  const heroTheme = SURFACE_HERO_THEME.candidate;
  const planTierLabel = planTier
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const pending = invites.filter(
    (i) => i.status === "PENDING" && new Date(i.expiresAt) >= new Date()
  );
  const inProgressInvites = pending.filter((i) => i.draftAnsweredCount > 0);
  const sentInvites = pending.filter((i) => i.draftAnsweredCount === 0);
  const completed = invites.filter((i) => i.status === "COMPLETED");
  const expired = invites.filter(
    (i) =>
      i.status === "EXPIRED" ||
      (i.status === "PENDING" && new Date(i.expiresAt) < new Date())
  );
  const completionPct = invites.length > 0
    ? Math.round((completed.length / invites.length) * 100)
    : 0;

  const sectionSuffix = (count: number) =>
    count !== 1
      ? t("hiring.candidatesSuffix", locale)
      : t("hiring.candidateSuffix", locale);

  return (
    <div className="flex flex-col gap-6">
      {/* ═══ HERO — candidate (terrakotta) variáns ═══ */}
      <SurfaceHero
        variant="candidate"
        eyebrow={(
          <SectionEyebrow tone="candidateOnDark">
            {`${t("hiring.eyebrow", locale)} · ${orgName}`}
          </SectionEyebrow>
        )}
        badge={(
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide"
            style={{ backgroundColor: heroTheme.badgeBg, color: heroTheme.badgeText }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {isHu ? `Csomag · ${planTierLabel}` : `Plan · ${planTierLabel}`}
          </span>
        )}
        title={(
          <h1 className="font-fraunces text-[27px] tracking-tight text-white md:text-[40px]">
            trita {t("hiring.title", locale)}
          </h1>
        )}
        summary={t("hiring.heroSummary", locale)}
        chips={[
          <span key="total" className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.78]">
            {invites.length} {t("hiring.candidatesTotal", locale).toLowerCase()}
          </span>,
          <span key="progress" className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.78]">
            {inProgressInvites.length} {t("hiring.inProgressLabel", locale).toLowerCase()}
          </span>,
          <span key="done" className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.78]">
            {completed.length} {t("hiring.completedLabel", locale).toLowerCase()}
          </span>,
        ]}
        actions={(
          <>
            {canInviteNew ? (
              <Button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                variant="ghost"
                className={[
                  "rounded-[10px] px-5 text-[12px] font-semibold",
                  showForm
                    ? "bg-white text-ink hover:bg-white/90 hover:text-ink"
                    : "bg-[var(--color-accent-candidate-primary)] text-[var(--color-layer-candidate-hero-to)] hover:bg-[var(--color-accent-candidate-primary)] hover:text-[var(--color-layer-candidate-hero-to)] hover:brightness-110",
                ].join(" ")}
              >
                {showForm
                  ? t("hiring.cancelButton", locale)
                  : t("hiring.inviteCandidate", locale)}
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                variant="ghost"
                className="rounded-[10px] border border-white/20 bg-white/10 px-5 text-[12px] text-white/60 hover:bg-white/10 hover:text-white/60"
              >
                {t("hiring.inviteCandidate", locale)}
              </Button>
            )}
            {!canInviteNew && (
              <span className="inline-flex items-center text-[11px] text-white/70">
                {isHu ? "Nincs elérhető credit új meghívóhoz." : "No credits available for new invites."}
              </span>
            )}
          </>
        )}
        aside={(
          <>
            <p className="text-micro uppercase tracking-widest text-white/[0.34]">
              {t("hiring.snapshotLabel", locale)}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="text-micro uppercase tracking-widest text-white/[0.35]">
                  {t("hiring.sectionInProgress", locale)}
                </p>
                <p className="mt-1 font-fraunces text-[22px] leading-none tabular-nums text-white">
                  {inProgressInvites.length}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="text-micro uppercase tracking-widest text-white/[0.35]">
                  {t("hiring.sectionSent", locale)}
                </p>
                <p className="mt-1 font-fraunces text-[22px] leading-none tabular-nums text-white">
                  {sentInvites.length}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="text-micro uppercase tracking-widest text-white/[0.35]">
                  {t("hiring.sectionCompleted", locale)}
                </p>
                <p className="mt-1 font-fraunces text-[22px] leading-none tabular-nums text-white">
                  {completed.length}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-micro text-white/[0.52]">
                <span>{t("hiring.completionRate", locale)}</span>
                <span className="font-semibold text-white/[0.7]">{completionPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${completionPct}%`, backgroundColor: heroTheme.primary }}
                />
              </div>
            </div>
          </>
        )}
      />

      {/* Kredit-állapot — kompakt sáv */}
      {creditBalance && (
        <DashboardPanel className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-accent-candidate-border bg-accent-candidate-soft px-3 py-1 text-micro font-semibold uppercase tracking-widest text-accent-candidate-strong">
              {creditBalance.available} {t("hiring.creditsAvailable", locale)}
            </span>
            <span className="text-[11px] text-muted">
              {isHu
                ? `${creditBalance.totalUsed} felhasznált · ${creditBalance.totalPurchased} összesen vásárolt`
                : `${creditBalance.totalUsed} used · ${creditBalance.totalPurchased} total purchased`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Link
                href={`/org/${orgId}/settings`}
                className="inline-flex min-h-[44px] items-center text-[11px] font-semibold text-accent-candidate transition-colors hover:text-accent-candidate-strong"
              >
                {isHu ? "Kreditek kezelése →" : "Manage credits →"}
              </Link>
            ) : creditBalance.available === 0 ? (
              <RequestCreditsButton orgId={orgId} locale={locale} />
            ) : null}
          </div>
        </DashboardPanel>
      )}

      {/* Kredit-hiány figyelmeztetés a managereknek */}
      {!canInviteNew && creditBalance !== null && (
        <div className="rounded-xl border border-state-warning-border bg-state-warning-bg px-5 py-3 text-caption text-state-warning-fg">
          {t("hiring.noCreditsWarning", locale)}
        </div>
      )}

      {/* Inline meghívó-űrlap */}
      {showForm && canInviteNew && (
        <DashboardPanel className="overflow-hidden">
          <div className="border-b border-sand bg-accent-candidate-soft/60 px-6 py-5">
            <SectionEyebrow tone="bronze">
              {t("hiring.inviteFormEyebrow", locale)}
            </SectionEyebrow>
            <h2 className="mt-1.5 font-fraunces text-title leading-none text-ink">
              {t("hiring.inviteCandidate", locale)}
            </h2>
            <p className="mt-2 text-[12px] text-ink-body">
              {locale === "en"
                ? "Set up candidate details and send an invite link in under a minute."
                : "Add meg a jelölt adatait, és egy percen belül küldhető az egyedi meghívólink."}
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <CandidateInviteForm
              locale={locale}
              teams={teams}
            />
          </div>
        </DashboardPanel>
      )}

      {/* Metrika-kártyák */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DashboardMetricCard
          accent="var(--color-accent-candidate-mid)"
          title={t("hiring.statInProgress", locale)}
          value={String(pending.length)}
          sub={isHu ? "Aktív meghívók" : "Active invites"}
        />
        <DashboardMetricCard
          accent="var(--color-state-success-solid)"
          title={t("hiring.statCompleted", locale)}
          value={String(completed.length)}
          sub={isHu ? "Elkészült kitöltések" : "Completed assessments"}
        />
        <DashboardMetricCard
          accent="var(--color-muted)"
          title={t("hiring.statExpired", locale)}
          value={String(expired.length)}
          sub={isHu ? "Lejárt meghívók" : "Expired invites"}
        />
      </div>

      {/* Folyamatban lévő jelöltek (megkezdett kitöltés) */}
      {inProgressInvites.length > 0 && (
        <CandidateSection
          label={`${t("hiring.sectionInProgress", locale)} · ${inProgressInvites.length} ${sectionSuffix(inProgressInvites.length)}`}
          description={
            isHu
              ? "Ezeknél a jelölteknél már elindult a kitöltés."
              : "These candidates have already started their assessment."
          }
          count={inProgressInvites.length}
          countClass="bg-accent-candidate-soft text-accent-candidate-strong"
        >
          {inProgressInvites.map((inv) => (
            <CandidateRow
              key={inv.id}
              invite={inv}
              orgId={orgId}
              locale={locale}
              dateLocale={dateLocale}
            />
          ))}
        </CandidateSection>
      )}

      {/* Elküldött meghívók (még nem kezdett kitöltés) */}
      {sentInvites.length > 0 && (
        <CandidateSection
          label={`${t("hiring.sectionSent", locale)} · ${sentInvites.length} ${sectionSuffix(sentInvites.length)}`}
          description={
            isHu
              ? "Kiküldve, de még nem kezdődött el a kitöltés."
              : "Invites are sent, but the assessment has not started yet."
          }
          count={sentInvites.length}
          countClass="bg-cream text-ink-body"
        >
          {sentInvites.map((inv) => (
            <CandidateRow
              key={inv.id}
              invite={inv}
              orgId={orgId}
              locale={locale}
              dateLocale={dateLocale}
            />
          ))}
        </CandidateSection>
      )}

      {/* Kitöltött jelöltek */}
      {completed.length > 0 && (
        <CandidateSection
          label={`${t("hiring.sectionCompleted", locale)} · ${completed.length} ${sectionSuffix(completed.length)}`}
          description={
            isHu
              ? "Kész eredmények, részletes riporttal."
              : "Finished assessments with detailed result pages."
          }
          count={completed.length}
          countClass="bg-state-success-bg text-state-success-fg"
        >
          {completed.map((inv) => (
            <CandidateRow
              key={inv.id}
              invite={inv}
              orgId={orgId}
              locale={locale}
              dateLocale={dateLocale}
            />
          ))}
        </CandidateSection>
      )}

      {/* Üres állapot */}
      {invites.length === 0 && !showForm && (
        <EmptyState
          className="border-dashed bg-white py-16"
          title={t("hiring.noCandidatesTitle", locale)}
          description={t("hiring.noCandidatesDesc", locale)}
          cta={
            canInviteNew ? (
              <Button
                type="button"
                onClick={() => setShowForm(true)}
                className="bg-accent-candidate px-5 text-caption text-white hover:bg-accent-candidate-strong hover:text-white"
              >
                {t("hiring.inviteCandidate", locale)}
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
