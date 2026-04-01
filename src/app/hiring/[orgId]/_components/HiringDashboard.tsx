"use client";

import { useState } from "react";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";
import { CandidateRevokeButton } from "@/components/manager/CandidateRevokeButton";
import { RequestCreditsButton } from "@/components/hiring/RequestCreditsButton";
import { Button, getButtonClassName } from "@/components/ui/primitives/Button";

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

interface CreditHistoryEntry {
  id: string;
  type: string;
  amount: number;
  balance: number;
  note: string | null;
  actorId: string | null;
  createdAt: string;
}

interface HiringDashboardProps {
  orgId: string;
  orgName: string;
  teams: Team[];
  invites: SerializedInvite[];
  locale: Locale;
  planTier: string;
  creditBalance: CreditBalance | null;
  creditHistory: CreditHistoryEntry[] | null;
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

function statusClass(status: string, isExpired: boolean): string {
  if (isExpired || status === "EXPIRED") return "bg-sand text-ink-body/60";
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (status === "CANCELED") return "bg-rose-50 text-rose-600";
  return "bg-amber-50 text-amber-700";
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
    <div className="rounded-2xl border border-sand bg-white px-4 py-3 shadow-[0_10px_26px_rgba(26,26,46,0.03)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-warm-mid text-[11px] font-bold text-ink-body">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">
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
                  className="h-full rounded-full bg-sage/60"
                  style={{
                    width: `${Math.min(100, Math.round((invite.draftAnsweredCount / invite.totalQuestions) * 100))}%`,
                  }}
                />
              </div>
              <span className="shrink-0 font-mono text-[9px] text-muted">
                {invite.draftAnsweredCount}/{invite.totalQuestions}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sand/80 pt-2.5">
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            statusClass(invite.status, isExpired),
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
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-sand bg-white text-ink-body hover:border-sage/30 hover:text-bronze"
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

export function HiringDashboard({
  orgId,
  orgName,
  teams,
  invites,
  locale,
  planTier,
  creditBalance,
  creditHistory,
  canInviteNew,
  isAdmin,
}: HiringDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [creditQty, setCreditQty] = useState(1);
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";
  const isHu = locale !== "en";
  const planTierLabel = planTier
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const creditUnitPrice = creditQty >= 10 ? 31.20 : creditQty >= 5 ? 33.15 : 39;
  const creditTotalValue = creditUnitPrice * creditQty;
  const creditTotal = creditTotalValue.toFixed(2);
  const creditDiscountPct = creditQty >= 10 ? 20 : creditQty >= 5 ? 15 : 0;
  const creditBaseTotal = 39 * creditQty;
  const creditSavings = Math.max(0, creditBaseTotal - creditTotalValue);

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
  const creditUsagePct = creditBalance && creditBalance.totalPurchased > 0
    ? Math.min(100, Math.round((creditBalance.totalUsed / creditBalance.totalPurchased) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[28px]"
        style={{ background: "linear-gradient(135deg, #234538 0%, #1d3b31 56%, #172f28 100%)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.05]" />
        <div className="pointer-events-none absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-[#d2a36a]/[0.17]" />
        <div className="px-6 py-6 sm:px-7 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/65">
                {`${t("hiring.eyebrow", locale)} · ${orgName}`}
              </p>
              <h1 className="mt-2 font-fraunces text-[34px] leading-none text-white md:text-[40px]">
                trita {t("hiring.title", locale)}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-relaxed text-white/70">
                {isHu
                  ? "Kezeld egy helyen a jelöltfolyamatot: meghívás, státusz és eredménykövetés."
                  : "Manage the full candidate flow in one place: invites, status, and results."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
                  {locale === "en" ? `Plan · ${planTierLabel}` : `Csomag · ${planTierLabel}`}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">
                  {invites.length} {t("hiring.candidatesTotal", locale).toLowerCase()}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">
                  {completed.length} {t("hiring.completedLabel", locale).toLowerCase()}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {canInviteNew ? (
                  <Button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    variant="ghost"
                    className={[
                      "rounded-[10px] px-5 text-[12px]",
                      showForm
                        ? "bg-white text-ink hover:bg-white/90 hover:text-ink"
                        : "bg-[#d2a36a] text-[#1d2d2a] hover:bg-[#d2a36a] hover:text-[#1d2d2a] hover:brightness-110",
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
                  <span className="text-[11px] text-white/70">
                    {isHu ? "Nincs elérhető credit új meghívóhoz." : "No credits available for new invites."}
                  </span>
                )}
              </div>
            </div>

            <aside className="hidden rounded-2xl border border-white/15 bg-white/[0.08] p-4 lg:block">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">
                Live snapshot
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/10 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-white/50">
                    {t("hiring.sectionInProgress", locale)}
                  </p>
                  <p className="mt-1 font-fraunces text-[20px] leading-none text-white">
                    {inProgressInvites.length}
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-white/50">
                    {t("hiring.sectionSent", locale)}
                  </p>
                  <p className="mt-1 font-fraunces text-[20px] leading-none text-white">
                    {sentInvites.length}
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-white/50">
                    {t("hiring.sectionCompleted", locale)}
                  </p>
                  <p className="mt-1 font-fraunces text-[20px] leading-none text-white">
                    {completed.length}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/65">
                  <span>{isHu ? "Lezárt arány" : "Completion rate"}</span>
                  <span className="font-semibold text-white/85">{completionPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${completionPct}%`, backgroundColor: "#d2a36a" }}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Credit pool bar — credit-based tiers */}
      {creditBalance && (
        <section className="overflow-hidden rounded-[24px] border border-sand bg-white shadow-[0_14px_32px_rgba(26,26,46,0.04)]">
          <div className="border-b border-sand bg-[linear-gradient(90deg,#fbf4e8_0%,#f8f2e8_55%,#f6eee2_100%)] px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bronze">
                  {t("hiring.creditEyebrow", locale)}
                </p>
                <p className="mt-1 text-[13px] text-ink-body">
                  {isHu
                    ? "A jelöltmeghívások kredit alapon működnek."
                    : "Candidate invites run on a credit-based model."}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-sage/20 bg-sage-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage-dark">
                {creditBalance.available} {t("hiring.creditsAvailable", locale)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-sand bg-white px-3 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    {t("hiring.creditsAvailable", locale)}
                  </p>
                  <p className="mt-1 font-fraunces text-[26px] leading-none text-sage-dark">
                    {creditBalance.available}
                  </p>
                </div>
                <div className="rounded-xl border border-sand bg-white px-3 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    {t("hiring.creditsPurchased", locale)}
                  </p>
                  <p className="mt-1 font-fraunces text-[26px] leading-none text-ink">
                    {creditBalance.totalPurchased}
                  </p>
                </div>
                <div className="rounded-xl border border-sand bg-white px-3 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    {t("hiring.creditsUsed", locale)}
                  </p>
                  <p className="mt-1 font-fraunces text-[26px] leading-none text-bronze-dark">
                    {creditBalance.totalUsed}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-sand bg-cream px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-body">
                  <span>{isHu ? "Felhasználási arány" : "Usage rate"}</span>
                  <span className="font-semibold text-ink">{creditUsagePct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-sage transition-all"
                    style={{ width: `${creditUsagePct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-muted">
                  {isHu
                    ? `${creditBalance.totalUsed} felhasznált · ${creditBalance.available} elérhető`
                    : `${creditBalance.totalUsed} used · ${creditBalance.available} available`}
                </p>
              </div>
            </div>

            <aside className="rounded-2xl border border-sand bg-[#fcf7ef] p-4">
              {isAdmin ? (
                <>
                  <p className="font-fraunces text-[24px] leading-none text-ink">
                    {isHu ? "Kredit vásárlás" : "Buy credits"}
                  </p>
                  <p className="mt-1.5 text-[12px] text-ink-body">
                    {isHu
                      ? "Válassz csomagot vagy állítsd be a darabszámot."
                      : "Choose a bundle or adjust quantity manually."}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[1, 5, 10].map((qty) => {
                      const active = creditQty === qty;
                      const discount = qty >= 10 ? 20 : qty >= 5 ? 15 : 0;
                      return (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setCreditQty(qty)}
                          className={[
                            "min-h-[44px] rounded-lg border px-2 text-[11px] font-semibold transition",
                            active
                              ? "border-sage/45 bg-sage-soft text-sage-dark"
                              : "border-sand bg-white text-ink-body hover:border-sage/30",
                          ].join(" ")}
                        >
                          {qty}×{discount > 0 ? ` · −${discount}%` : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center overflow-hidden rounded-lg border border-sand bg-white">
                      <button
                        type="button"
                        onClick={() => setCreditQty((q) => Math.max(1, q - 1))}
                        className="min-h-[40px] w-9 text-sm text-ink-body transition hover:text-bronze"
                      >
                        −
                      </button>
                      <span className="min-w-[34px] text-center font-mono text-[12px] font-semibold text-ink">
                        {creditQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCreditQty((q) => q + 1)}
                        className="min-h-[40px] w-9 text-sm text-ink-body transition hover:text-bronze"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-muted">
                        €{creditUnitPrice.toFixed(2)}/{isHu ? "db" : "credit"}
                      </p>
                      <p className="text-[11px] font-semibold text-ink">
                        {creditDiscountPct > 0
                          ? `${isHu ? "kedvezmény" : "discount"} −${creditDiscountPct}%`
                          : (isHu ? "alap ár" : "base price")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-sand bg-white px-3 py-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
                        {isHu ? "Összesen" : "Total"}
                      </p>
                      <p className="font-fraunces text-[24px] leading-none text-ink">€{creditTotal}</p>
                      {creditSavings > 0 && (
                        <p className="text-[10px] text-emerald-700">
                          {isHu
                            ? `Megtakarítás: €${creditSavings.toFixed(2)}`
                            : `You save: €${creditSavings.toFixed(2)}`}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/billing/checkout?plan=candidate_custom&qty=${creditQty}`}
                      className={getButtonClassName({
                        size: "sm",
                        className: "bg-sage px-4 text-[11px] text-white hover:bg-sage-dark hover:text-white",
                      })}
                    >
                      +{creditQty}
                    </Link>
                  </div>
                </>
              ) : creditBalance.available === 0 ? (
                <div className="space-y-2">
                  <p className="text-[12px] text-ink-body">
                    {isHu
                      ? "Nincs elérhető kredited. Küldj gyors igényt az adminnak."
                      : "No credits left. Send a quick request to your admin."}
                  </p>
                  <RequestCreditsButton orgId={orgId} locale={locale} />
                </div>
              ) : (
                <p className="text-[12px] text-ink-body">
                  {isHu
                    ? "Van elérhető kredited, így új jelölteket azonnal meghívhatsz."
                    : "You have available credits, so you can invite new candidates right away."}
                </p>
              )}
            </aside>
          </div>
        </section>
      )}

      {/* No-credits warning banner for managers */}
      {!canInviteNew && creditBalance !== null && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          {t("hiring.noCreditsWarning", locale)}
        </div>
      )}

      {/* Inline invite form */}
      {showForm && canInviteNew && (
        <div className="overflow-hidden rounded-[24px] border border-sand bg-white shadow-[0_14px_35px_rgba(26,26,46,0.05)]">
          <div className="border-b border-sand bg-warm px-6 py-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-bronze/85">
              {t("hiring.inviteFormEyebrow", locale)}
            </p>
            <h2 className="mt-1.5 font-fraunces text-[26px] leading-none text-ink">
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
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: t("hiring.statInProgress", locale),
            value: pending.length,
            color: "var(--color-bronze)",
            body: isHu ? "Aktív meghívók" : "Active invites",
          },
          {
            label: t("hiring.statCompleted", locale),
            value: completed.length,
            color: "var(--color-state-success-strong)",
            body: isHu ? "Elkészült kitöltések" : "Completed assessments",
          },
          {
            label: t("hiring.statExpired", locale),
            value: expired.length,
            color: "var(--color-muted)",
            body: isHu ? "Lejárt meghívók" : "Expired invites",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-sand bg-white px-5 py-4 shadow-[0_10px_24px_rgba(26,26,46,0.03)]"
          >
            <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ background: s.color }}
            />
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
              {s.label}
            </p>
            <p className="mt-1 font-fraunces text-[30px] leading-none text-ink">
              {s.value}
            </p>
            <p className="mt-1 text-[11px] text-ink-body">{s.body}</p>
          </div>
        ))}
      </div>

      {/* In-progress candidates (draft started) */}
      {inProgressInvites.length > 0 && (
        <section className="rounded-2xl border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.03)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-bronze">
                {`${t("hiring.sectionInProgress", locale)} · ${inProgressInvites.length} ${inProgressInvites.length !== 1 ? t("hiring.candidatesSuffix", locale) : t("hiring.candidateSuffix", locale)}`}
              </p>
              <p className="mt-1 text-[12px] text-ink-body">
                {isHu
                  ? "Ezeknél a jelölteknél már elindult a kitöltés."
                  : "These candidates have already started their assessment."}
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-surface-chip-warm)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-accent-primary-strong)]">
              {inProgressInvites.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {inProgressInvites.map((inv) => (
              <CandidateRow
                key={inv.id}
                invite={inv}
                orgId={orgId}
                locale={locale}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sent candidates (not yet started) */}
      {sentInvites.length > 0 && (
        <section className="rounded-2xl border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.03)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
                {`${t("hiring.sectionSent", locale)} · ${sentInvites.length} ${sentInvites.length !== 1 ? t("hiring.candidatesSuffix", locale) : t("hiring.candidateSuffix", locale)}`}
              </p>
              <p className="mt-1 text-[12px] text-ink-body">
                {isHu
                  ? "Kiküldve, de még nem kezdődött el a kitöltés."
                  : "Invites are sent, but the assessment has not started yet."}
              </p>
            </div>
            <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-semibold text-ink-body">
              {sentInvites.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {sentInvites.map((inv) => (
              <CandidateRow
                key={inv.id}
                invite={inv}
                orgId={orgId}
                locale={locale}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed candidates */}
      {completed.length > 0 && (
        <section className="rounded-2xl border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.03)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
                {`${t("hiring.sectionCompleted", locale)} · ${completed.length} ${completed.length !== 1 ? t("hiring.candidatesSuffix", locale) : t("hiring.candidateSuffix", locale)}`}
              </p>
              <p className="mt-1 text-[12px] text-ink-body">
                {isHu
                  ? "Kész eredmények, részletes riporttal."
                  : "Finished assessments with detailed result pages."}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              {completed.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {completed.map((inv) => (
              <CandidateRow
                key={inv.id}
                invite={inv}
                orgId={orgId}
                locale={locale}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Credit history — admin only, when credits are tracked */}
      {isAdmin && creditHistory && creditHistory.length > 0 && (
        <div className="rounded-xl border border-sand bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bronze mb-3">
            {t("hiring.creditLogEyebrow", locale)}
          </p>
          <div className="divide-y divide-sand">
            {creditHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-xs text-ink-body truncate">
                    {entry.note ?? (entry.type === "purchase"
                      ? t("hiring.creditPurchase", locale)
                      : t("hiring.creditUsage", locale))}
                  </p>
                  <p className="text-[10px] text-muted">
                    {new Date(entry.createdAt).toLocaleDateString(
                      locale === "en" ? "en-GB" : "hu-HU",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      entry.amount > 0 ? "text-emerald-700" : "text-bronze"
                    }`}
                  >
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                  </span>
                  <span className="font-mono text-[10px] text-muted w-6 text-right">
                    {entry.balance}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {invites.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand bg-white py-16 text-center">
          <p className="mb-1 text-sm font-semibold text-ink">
            {t("hiring.noCandidatesTitle", locale)}
          </p>
          <p className="mb-4 text-xs text-muted">
            {t("hiring.noCandidatesDesc", locale)}
          </p>
          {canInviteNew && (
            <Button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-sage px-5 text-sm text-white hover:bg-sage-dark hover:text-white"
            >
              {t("hiring.inviteCandidate", locale)}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
