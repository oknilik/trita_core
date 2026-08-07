"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

interface Team {
  id: string;
  name: string;
}

interface CandidateInviteFormProps {
  locale: string;
  teams: Team[];
  preselectedTeamId?: string;
}

interface CreatedInvite {
  id: string;
  token: string;
  email?: string | null;
  name?: string | null;
  position?: string | null;
}

export function CandidateInviteForm({ locale, teams, preselectedTeamId }: CandidateInviteFormProps) {
  const loc: Locale = locale === "en" ? "en" : "hu";
  const isHu = loc !== "en";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [teamId, setTeamId] = useState(preselectedTeamId ?? "");
  const [inviteLocale, setInviteLocale] = useState<"hu" | "en">(locale === "en" ? "en" : "hu");
  const [includeTeamRole, setIncludeTeamRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedInvite(null);
    if (!name.trim()) {
      setError(t("manager.candidateInvite.nameRequired", loc));
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, string | boolean> = {};
      if (email.trim()) body.email = email.trim();
      if (name.trim()) body.name = name.trim();
      if (position.trim()) body.position = position.trim();
      if (teamId) body.teamId = teamId;
      if (includeTeamRole) body.includeTeamRole = true;
      body.inviteLocale = inviteLocale;

      const res = await fetch("/api/manager/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { invite?: CreatedInvite; error?: string };
      if (!res.ok) {
        setError(t("manager.candidateInvite.createError", loc));
        return;
      }
      if (data.invite) {
        setCreatedInvite(data.invite);
        setEmail("");
        setName("");
        setPosition("");
        setTeamId("");
        router.refresh();
      }
    } catch {
      setError(t("manager.candidateInvite.genericError", loc));
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!createdInvite) return;
    const link = `${appUrl}/apply/${createdInvite.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => {/* noop */});
  }

  const labelClass =
    "font-dm-sans text-micro font-semibold uppercase tracking-widest text-muted";
  // Terrakotta (jelölt-felület) fókusz-akcent — 2026-08-05 vizuális frissítés.
  const inputClass =
    // Mobilon 16px-es mező-font: az iOS Safari 16px alatt fókuszkor
    // rázoomol és elugrik a layout. md-től marad az eredeti 13px.
    "min-h-[46px] rounded-xl border border-sand bg-cream px-3.5 text-base text-ink outline-none transition focus:border-accent-candidate/60 focus:bg-surface-card focus:shadow-[0_0_0_3px_rgba(138,74,50,0.10)] md:text-caption";

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* A cím/leírás a HiringDashboard panel-fejlécében él — itt nem
            duplikáljuk. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t("manager.candidateInvite.nameLabel", loc)}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("manager.candidateInvite.namePlaceholder", loc)}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t("manager.candidateInvite.emailLabel", loc)}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("manager.candidateInvite.emailPlaceholder", loc)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t("manager.candidateInvite.positionLabel", loc)}</span>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={t("manager.candidateInvite.positionPlaceholder", loc)}
              className={inputClass}
            />
          </label>
          {teams.length > 0 && (
            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t("manager.candidateInvite.teamLabel", loc)}</span>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t("manager.candidateInvite.noTeam", loc)}</option>
                {teams.map((tm) => (
                  <option key={tm.id} value={tm.id}>{tm.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        {/* Opcionális 2. lépés: csapatszerep-kérdőív a TRITAN után */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-surface-card px-4 py-3 transition hover:border-accent-candidate-border">
          <input
            type="checkbox"
            checked={includeTeamRole}
            onChange={(e) => setIncludeTeamRole(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent-candidate)]"
          />
          <span>
            <span className="block text-caption font-semibold text-ink">
              {isHu ? "Csapatszerep-kérdőív is" : "Include team-role questionnaire"}
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-body">
              {isHu
                ? "A teszt után a jelölt egy rövid (~3 perces) csapatszerep-kérdőívet is kap — átugorhatja."
                : "After the assessment the candidate also gets a short (~3 min) team-role questionnaire — they can skip it."}
            </span>
          </span>
        </label>

        <div className="rounded-xl border border-sand bg-surface-card px-4 py-3">
          <p className={labelClass}>{t("manager.candidateInvite.emailLang", loc)}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-[280px]">
            <button
              type="button"
              onClick={() => setInviteLocale("hu")}
              className={[
                "min-h-[44px] rounded-lg border text-[12px] font-semibold transition",
                inviteLocale === "hu"
                  ? "border-accent-candidate-border bg-accent-candidate-soft text-accent-candidate-strong"
                  : "border-sand bg-cream text-ink-body hover:border-accent-candidate-border hover:bg-surface-card",
              ].join(" ")}
            >
              Magyar
            </button>
            <button
              type="button"
              onClick={() => setInviteLocale("en")}
              className={[
                "min-h-[44px] rounded-lg border text-[12px] font-semibold transition",
                inviteLocale === "en"
                  ? "border-accent-candidate-border bg-accent-candidate-soft text-accent-candidate-strong"
                  : "border-sand bg-cream text-ink-body hover:border-accent-candidate-border hover:bg-surface-card",
              ].join(" ")}
            >
              English
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-state-error-border bg-state-error-bg px-4 py-2.5 text-caption text-state-error-fg">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand bg-surface-card px-4 py-3">
          <p className="text-[12px] text-ink-body">
            {isHu ? "Meghívónként 1 credit kerül felhasználásra." : "Each invite uses 1 credit."}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] rounded-[10px] bg-accent-candidate px-6 text-[12px] font-semibold text-white transition hover:bg-accent-candidate-strong disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-body/50"
          >
            {loading
              ? t("manager.candidateInvite.creating", loc)
              : t("manager.candidateInvite.createInvite", loc)}
          </button>
        </div>
      </form>

      {createdInvite && (
        <div className="rounded-2xl border border-sage/20 bg-[var(--color-sage-ghost)] p-4 sm:p-5">
          <p className="mb-1 text-micro font-semibold uppercase tracking-widest text-sage-dark/70">
            {isHu ? "Sikeres meghívó" : "Invite created"}
          </p>
          <p className="mb-2 text-body font-semibold text-sage-dark">
            {t("manager.candidateInvite.inviteCreated", loc)}
          </p>
          <p className="mb-3 text-[12px] text-sage-dark/80">
            {t("manager.candidateInvite.copyInstruction", loc)}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-sage/20 bg-surface-card px-3 py-2 text-[12px] text-ink-body">
              {`${appUrl}/apply/${createdInvite.token}`}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] shrink-0 rounded-lg border border-sage/25 bg-surface-card px-4 text-[12px] font-semibold text-sage-dark transition hover:bg-sage-soft"
            >
              {copied ? t("manager.candidateInvite.copied", loc) : t("manager.candidateInvite.copy", loc)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
