"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrgStatusResponse {
  org: { id: string; name: string; status: string; createdAt: string };
  teams: Array<{
    id: string;
    name: string;
    inviteUrl: string | null;
    members: Array<{
      userId: string;
      username: string;
      role: string;
      joinedAt: string | null;
      assessmentDone: boolean;
      assessmentScore: number | null;
      assessmentAt: string | null;
    }>;
  }>;
  stats: {
    totalMembers: number;
    completedCount: number;
    pendingCount: number;
    teamMapUnlocked: boolean;
    adminHasAssessment: boolean;
    firstTeamInviteUrl: string | null;
  };
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const btnSm = "inline-flex items-center gap-1.5 rounded-lg border border-sand px-3.5 py-1.5 text-xs font-semibold text-ink-body transition-colors hover:border-sage hover:text-bronze cursor-pointer bg-white";
const btnPrimary = "inline-flex items-center gap-2 rounded-lg bg-sage px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sage-dark cursor-pointer";

// ── Avatar colors ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#c17f4a", "#3d6b5e", "#3d5c6a", "#7a5c3a", "#4a4a5e",
  "#6a3a5c", "#3a5c6a", "#5c6a3a",
];

function avatarColor(username: string) {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = username.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string | null) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("hu-HU", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AdminDashboard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [data, setData] = useState<OrgStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/org-status");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSkipAssessment = async () => {
    if (skipping) return;
    setSkipping(true);
    try {
      const res = await fetch("/api/assessment/skip", { method: "POST" });
      if (res.ok) {
        setLoading(true);
        await fetchStatus();
      }
    } finally {
      setSkipping(false);
    }
  };

  const handleReactivate = async () => {
    if (!data || reactivating) return;
    setReactivating(true);
    try {
      const res = await fetch(`/api/org/${data.org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (res.ok) {
        setLoading(true);
        await fetchStatus();
      }
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-sage" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-ink-warm">Nem sikerült betölteni az adatokat.</p>
        <button onClick={fetchStatus} className={btnPrimary}>Újrapróbálás</button>
      </main>
    );
  }

  const { org, teams, stats } = data;
  const firstTeam = teams[0] ?? null;
  const inviteUrl = stats.firstTeamInviteUrl;

  const teamStatusLabel = stats.teamMapUnlocked
    ? "csapatkép elérhető"
    : stats.pendingCount > 0
    ? `${stats.pendingCount} tag vár`
    : "profil feltöltés alatt";

  // ── Setup steps logic ──────────────────────────────────────────────────────

  type StepAction =
    | { label: string; href: string; copy?: undefined; skip?: undefined }
    | { label: string; copy: string; href?: undefined; skip?: undefined }
    | { label: string; skip: true; href?: undefined; copy?: undefined }
    | null;

  type Step = {
    num: string;
    title: string;
    desc: string;
    done: boolean;
    action: StepAction;
    secondaryAction?: StepAction;
    countLabel?: string | null;
    locked?: boolean;
  };

  const steps: Step[] = [
    {
      num: "// 01",
      title: "Szervezet létrehozva",
      desc: `${org.name} · létrehozva: ${formatDate(org.createdAt)}`,
      done: true,
      action: null,
    },
    {
      num: "// 02",
      title: "Első csapat létrehozva",
      desc: firstTeam
        ? `${firstTeam.name} · ${firstTeam.members.length} tag`
        : "Nincs csapat még",
      done: !!firstTeam,
      action: !firstTeam ? { label: "Csapat létrehozása", href: `/org/${org.id}` } : null,
    },
    {
      num: "// 03",
      title: "Saját felmérésed kész",
      desc: stats.adminHasAssessment
        ? "Az eredményed elérhető a saját profil nézetben."
        : "Töltsd ki a felmérést – ez szükséges az összehasonlításhoz.",
      done: stats.adminHasAssessment,
      action: !stats.adminHasAssessment
        ? { label: "Felmérés indítása", href: "/assessment" }
        : null,
      secondaryAction: !stats.adminHasAssessment
        ? { label: "Kihagyás", skip: true as const }
        : null,
    },
    {
      num: "// 04",
      title: "Tagok meghívása",
      desc:
        stats.completedCount === 0
          ? "Még senki sem töltötte ki."
          : `${stats.completedCount} tag kitöltötte · ${stats.pendingCount} még nem`,
      done: stats.completedCount >= 2,
      countLabel: firstTeam
        ? `${stats.completedCount} / ${stats.totalMembers}`
        : null,
      action: inviteUrl ? { label: "Link másolása", copy: inviteUrl } : null,
    },
    {
      num: "// 05",
      title: "Csapatkép feloldása",
      desc: stats.teamMapUnlocked
        ? "A csapatkép elérhető! Nézd meg az összesített radar diagramot."
        : `Még ${Math.max(0, 3 - stats.completedCount)} kitöltés szükséges a minimumhoz.`,
      done: stats.teamMapUnlocked,
      action: null,
      locked: !stats.teamMapUnlocked,
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedSteps / steps.length) * 100);
  const circumference = 125.66;
  const dashOffset = circumference * (1 - progressPct / 100);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-cream">
      <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-8 px-4 py-10 md:py-12">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-bronze">
              // vezérlőpult
            </p>
            <h1 className="mt-1 font-fraunces text-[28px] leading-tight text-ink">
              {org.name}
            </h1>
            <p className="mt-1 text-sm text-ink-warm">
              {firstTeam ? `${firstTeam.name} · ${firstTeam.members.length} tag` : "Még nincs csapat"}
              {" · "}
              <span className="font-medium text-ink-body">org admin</span>
            </p>
          </div>
        </div>

        {/* ── Nav cards ── */}
        {org.status !== "INACTIVE" && (
          <div className={`grid gap-3 ${firstTeam && isAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
            {firstTeam && (
              <Link
                href={`/team/${firstTeam.id}`}
                className="block rounded-xl border border-sand bg-white p-5 transition-all hover:border-sage"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-bronze mb-1">
                  // csapat
                </p>
                <p className="font-fraunces text-xl text-ink">{firstTeam.name}</p>
                <p className="text-xs text-muted mt-1">
                  {firstTeam.members.length} tag · {teamStatusLabel}
                </p>
                <p className="text-sm font-semibold text-bronze mt-3 text-right">
                  Megnyitás →
                </p>
              </Link>
            )}
            {isAdmin && (
              <Link
                href={`/org/${org.id}`}
                className="block rounded-xl border border-sand bg-white p-5 transition-all hover:border-sage"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-bronze mb-1">
                  // szervezet
                </p>
                <p className="font-fraunces text-xl text-ink">{org.name}</p>
                <p className="text-xs text-muted mt-1">
                  {teams.length} csapat · {stats.totalMembers} tag
                </p>
                <p className="text-sm font-semibold text-bronze mt-3 text-right">
                  Megnyitás →
                </p>
              </Link>
            )}
          </div>
        )}

        {/* ── Inactive banner ── */}
        {org.status === "INACTIVE" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-rose-600 mb-1">// inaktív</p>
            <h2 className="font-fraunces text-lg text-rose-900 mb-2">Szervezet inaktív</h2>
            <p className="mb-4 text-sm text-rose-700">
              Ez a szervezet jelenleg inaktív – a tagok nem tudnak hozzáférni az org-specifikus oldalakhoz.
              Reaktiváld az alábbi gombbal.
            </p>
            <button
              type="button"
              onClick={handleReactivate}
              disabled={reactivating}
              className="min-h-[44px] rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
            >
              {reactivating ? "..." : "Szervezet reaktiválása"}
            </button>
          </div>
        )}

        {/* ── Getting Started Card ── */}
        {completedSteps < steps.length && <div className="rounded-2xl border border-sand bg-white shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-start justify-between gap-4 border-b border-sand px-4 py-4 sm:gap-6 sm:px-7 sm:py-6">
            <div>
              <h2 className="font-fraunces text-xl text-ink">Első lépések</h2>
              <p className="mt-1 text-[13px] text-ink-warm max-w-sm">
                A csapatkép akkor válik teljessé, ha mindenki kitöltötte a felmérést.
              </p>
            </div>
            {/* Progress ring */}
            <div className="flex flex-shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="font-mono text-[11px] text-ink-body">
                  {completedSteps} / {steps.length}
                </p>
                <p className="font-mono text-[10px] text-muted">kész</p>
              </div>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="20" fill="none" stroke="#e8e0d3" strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="20" fill="none"
                  stroke="#c17f4a" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
                />
                <text
                  x="26" y="26"
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 500, fill: "#1a1a2e" }}
                >
                  {progressPct}%
                </text>
              </svg>
            </div>
          </div>

          {/* Steps */}
          <div>
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 border-b border-sand px-4 py-4 sm:gap-4 sm:px-7 sm:py-5 last:border-b-0 transition-colors hover:bg-cream/60 ${step.done ? "opacity-60" : ""}`}
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base ${
                    step.done
                      ? "border border-[rgba(26,92,58,0.2)] bg-[rgba(26,92,58,0.08)] text-sage"
                      : step.locked
                      ? "border border-sand bg-[rgba(160,154,144,0.1)] text-muted"
                      : "border border-[rgba(200,65,10,0.2)] bg-[rgba(200,65,10,0.08)] text-bronze"
                  }`}
                >
                  {step.done ? "✓" : step.locked ? "🔒" : "⟳"}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{step.num}</span>
                    <span className={`text-[14px] font-semibold ${step.done ? "text-ink-warm line-through decoration-[#c8b09a]" : "text-ink"}`}>
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-warm">{step.desc}</p>
                </div>

                {/* Action */}
                <div className="flex flex-shrink-0 items-center gap-2 mt-0.5">
                  {step.countLabel && !step.done && (
                    <span className="rounded-full border border-[rgba(200,65,10,0.2)] bg-[rgba(200,65,10,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-bronze">
                      {step.countLabel}
                    </span>
                  )}
                  {step.done && !step.action && (
                    <span className="rounded-full border border-[rgba(26,92,58,0.2)] bg-[rgba(26,92,58,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-sage">
                      kész
                    </span>
                  )}
                  {step.locked && !step.done && !step.action && (
                    <span className="rounded-full border border-sand bg-[rgba(160,154,144,0.1)] px-2.5 py-0.5 font-mono text-[10px] text-muted">
                      {Math.max(0, 3 - stats.completedCount) > 0 ? `${Math.max(0, 3 - stats.completedCount)} hiányzik` : "hamarosan"}
                    </span>
                  )}
                  {step.action?.copy && (
                    <button
                      onClick={() => handleCopy(step.action!.copy as string)}
                      className={btnSm}
                    >
                      {copiedUrl === step.action.copy ? "✓ Másolva!" : "Link másolása"}
                    </button>
                  )}
                  {step.action?.href && (
                    <Link href={step.action.href} className={step.done ? btnSm : btnPrimary}>
                      {step.action.label}
                    </Link>
                  )}
                  {step.secondaryAction?.skip && (
                    <button
                      onClick={handleSkipAssessment}
                      disabled={skipping}
                      className={btnSm}
                    >
                      {skipping ? "..." : step.secondaryAction.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              label: "kitöltések",
              value: String(stats.completedCount),
              sub: `${stats.totalMembers} tagból`,
              note: stats.pendingCount > 0 ? `${stats.pendingCount} tag még nem kezdte el` : "Mindenki kész!",
              noteHighlight: false,
              accentColor: "#6366F1",
            },
            {
              label: "csapatkép",
              value: stats.teamMapUnlocked ? "elérhető" : `${Math.max(0, 3 - stats.completedCount)} hiányzik`,
              sub: stats.teamMapUnlocked ? "minimum teljesítve" : "3 kitöltés kell",
              note: stats.teamMapUnlocked ? "Radar diagram feloldva" : `${stats.completedCount} / 3 minimum`,
              noteHighlight: stats.teamMapUnlocked,
              accentColor: "#10B981",
            },
            {
              label: "observer párok",
              value: "0",
              sub: "aktív visszajelzés",
              note: "Csapatkép után elérhető",
              noteHighlight: false,
              accentColor: "#8B5CF6",
            },
          ].map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-sand bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.accentColor }} />
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{s.label}</p>
              <p className="mt-2 font-fraunces text-[32px] leading-none text-ink">{s.value}</p>
              <p className="mt-1 text-[12px] text-ink-warm">{s.sub}</p>
              <div className="mt-3 border-t border-sand pt-3 text-[11px] text-muted">
                {s.noteHighlight ? (
                  <span className="text-sage font-medium">{s.note}</span>
                ) : (
                  s.note
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Team Tables ── */}
        {teams.filter((t) => t.members.length > 0).map((team) => (
          <div key={team.id} className="overflow-hidden rounded-2xl border border-sand bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-sand px-4 py-4 sm:px-7 sm:py-5">
              <div>
                <Link href={`/team/${team.id}`} className="font-fraunces text-[16px] text-ink hover:text-bronze transition-colors">
                  {team.name} →
                </Link>
                <p className="text-[12px] text-muted">
                  {team.members.length} tag · {team.members.filter((m) => m.assessmentDone).length} kész ·{" "}
                  {team.members.filter((m) => !m.assessmentDone).length} várakozik
                </p>
              </div>
              {team.inviteUrl && (
                <button onClick={() => handleCopy(team.inviteUrl!)} className={btnSm}>
                  {copiedUrl === team.inviteUrl ? "✓ Másolva!" : "Meghívó másolás"}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-sand bg-cream/60">
                  {["Tag", "Státusz", "Átlagos eredmény", "Csatlakozás"].map((h) => (
                    <th key={h} className="px-7 py-3 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.members.map((member) => (
                  <tr key={member.userId} className="border-b border-sand transition-colors hover:bg-cream/70 last:border-b-0">
                    <td className="px-7 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                          style={{ background: avatarColor(member.username) }}
                        >
                          {initials(member.username)}
                        </div>
                        <span className="text-[13px] font-medium text-ink">{member.username}</span>
                      </div>
                    </td>
                    <td className="px-7 py-3.5">
                      {member.assessmentDone ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,92,58,0.2)] bg-[rgba(26,92,58,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-sage">
                          ✓ kész
                        </span>
                      ) : member.joinedAt ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(200,65,10,0.2)] bg-[rgba(200,65,10,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-bronze">
                          ⟳ folyamatban
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-[rgba(160,154,144,0.1)] px-2.5 py-0.5 font-mono text-[10px] text-muted">
                          meghívva
                        </span>
                      )}
                    </td>
                    <td className="px-7 py-3.5">
                      {member.assessmentScore !== null ? (
                        <div className="flex items-center gap-2.5">
                          <div className="h-1 w-14 overflow-hidden rounded-full bg-sand">
                            <div
                              className="h-full rounded-full bg-sage transition-all"
                              style={{ width: `${member.assessmentScore}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-ink-body">{member.assessmentScore}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-muted">–</span>
                      )}
                    </td>
                    <td className="px-7 py-3.5 text-[12px] text-muted">
                      {formatDate(member.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))}

        {/* ── Invite Banner ── */}
        {inviteUrl && (
          <div className="relative overflow-hidden rounded-2xl bg-ink p-7 md:p-8">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(200,65,10,0.3) 0%, transparent 70%)" }}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[rgba(250,249,246,0.45)]">
              // meghívó link
            </p>
            <h3 className="mt-2 font-fraunces text-[18px] text-cream">Hívd meg a csapatod</h3>
            <p className="mt-1.5 text-[12px] text-[rgba(250,249,246,0.5)] max-w-sm">
              Oszd meg ezt a linket a csapattagjaiddal. Regisztráció után automatikusan
              csatlakoznak és elkezdhetik a felmérést.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(250,249,246,0.1)] bg-[rgba(250,249,246,0.05)] px-4 py-2.5 max-w-sm">
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] text-[rgba(250,249,246,0.55)]">
                {inviteUrl}
              </span>
              <button
                onClick={() => handleCopy(inviteUrl)}
                className="flex-shrink-0 rounded-lg bg-sage px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-sage-dark"
              >
                {copiedUrl === inviteUrl ? "✓ Másolva!" : "Másolás"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
