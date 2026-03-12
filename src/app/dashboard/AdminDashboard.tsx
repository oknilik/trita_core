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

const btnSm = "inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4dc] px-3.5 py-1.5 text-xs font-semibold text-[#3d3a35] transition-colors hover:border-[#c8410a] hover:text-[#c8410a] cursor-pointer bg-white";
const btnPrimary = "inline-flex items-center gap-2 rounded-lg bg-[#c8410a] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#a8340a] cursor-pointer";

// ── Avatar colors ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#c8410a", "#1a5c3a", "#3d5c6a", "#7a5c3a", "#5a5650",
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

export function AdminDashboard() {
  const [data, setData] = useState<OrgStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8e4dc] border-t-[#c8410a]" />
          <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-[#7a756e]">Nem sikerült betölteni az adatokat.</p>
        <button onClick={fetchStatus} className={btnPrimary}>Újrapróbálás</button>
      </main>
    );
  }

  const { org, teams, stats } = data;
  const firstTeam = teams[0] ?? null;
  const inviteUrl = stats.firstTeamInviteUrl;

  // ── Setup steps logic ──────────────────────────────────────────────────────

  type StepAction =
    | { label: string; href: string; copy?: undefined }
    | { label: string; copy: string; href?: undefined }
    | null;

  type Step = {
    num: string;
    title: string;
    desc: string;
    done: boolean;
    action: StepAction;
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
    <div className="bg-[#faf9f6]">
      <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-8 px-4 py-10 md:py-12">

        {/* ── Page header ── */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#c8410a]">
            // vezérlőpult
          </p>
          <h1 className="mt-1 font-playfair text-[28px] leading-tight text-[#1a1814]">
            {org.name}
          </h1>
          <p className="mt-1 text-sm text-[#7a756e]">
            {firstTeam ? `${firstTeam.name} · ${firstTeam.members.length} tag` : "Még nincs csapat"}
            {" · "}
            <span className="font-medium text-[#3d3a35]">org admin</span>
          </p>
        </div>

        {/* ── Getting Started Card ── */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-start justify-between gap-6 border-b border-[#e8e4dc] px-7 py-6">
            <div>
              <h2 className="font-playfair text-xl text-[#1a1814]">Első lépések</h2>
              <p className="mt-1 text-[13px] text-[#7a756e] max-w-sm">
                A csapatkép akkor válik teljessé, ha mindenki kitöltötte a felmérést.
              </p>
            </div>
            {/* Progress ring */}
            <div className="flex flex-shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="font-mono text-[11px] text-[#3d3a35]">
                  {completedSteps} / {steps.length}
                </p>
                <p className="font-mono text-[10px] text-[#a09a90]">kész</p>
              </div>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="20" fill="none" stroke="#e8e4dc" strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="20" fill="none"
                  stroke="#c8410a" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
                />
                <text
                  x="26" y="26"
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 500, fill: "#1a1814" }}
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
                className={`flex items-start gap-4 border-b border-[#e8e4dc] px-7 py-5 last:border-b-0 transition-colors hover:bg-[#faf9f6]/60 ${step.done ? "opacity-60" : ""}`}
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base ${
                    step.done
                      ? "border border-[rgba(26,92,58,0.2)] bg-[rgba(26,92,58,0.08)] text-[#1a5c3a]"
                      : step.locked
                      ? "border border-[#e8e4dc] bg-[rgba(160,154,144,0.1)] text-[#a09a90]"
                      : "border border-[rgba(200,65,10,0.2)] bg-[rgba(200,65,10,0.08)] text-[#c8410a]"
                  }`}
                >
                  {step.done ? "✓" : step.locked ? "🔒" : "⟳"}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#a09a90]">{step.num}</span>
                    <span className={`text-[14px] font-semibold ${step.done ? "text-[#7a756e] line-through decoration-[#c8b09a]" : "text-[#1a1814]"}`}>
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[#7a756e]">{step.desc}</p>
                </div>

                {/* Action */}
                <div className="flex flex-shrink-0 items-center gap-2 mt-0.5">
                  {step.countLabel && !step.done && (
                    <span className="rounded-full border border-[rgba(200,65,10,0.2)] bg-[rgba(200,65,10,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-[#c8410a]">
                      {step.countLabel}
                    </span>
                  )}
                  {step.done && !step.action && (
                    <span className="rounded-full border border-[rgba(26,92,58,0.2)] bg-[rgba(26,92,58,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-[#1a5c3a]">
                      kész
                    </span>
                  )}
                  {step.locked && !step.done && !step.action && (
                    <span className="rounded-full border border-[#e8e4dc] bg-[rgba(160,154,144,0.1)] px-2.5 py-0.5 font-mono text-[10px] text-[#a09a90]">
                      {Math.max(0, 3 - stats.completedCount) > 0 ? `${Math.max(0, 3 - stats.completedCount)} hiányzik` : "hamarosan"}
                    </span>
                  )}
                  {step.action?.copy && (
                    <button
                      onClick={() => handleCopy(step.action!.copy as string)}
                      className={btnSm}
                    >
                      {copied ? "✓ Másolva!" : "Link másolása"}
                    </button>
                  )}
                  {step.action?.href && (
                    <Link href={step.action.href} className={step.done ? btnSm : btnPrimary}>
                      {step.action.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              label: "kitöltések",
              value: String(stats.completedCount),
              sub: `${stats.totalMembers} tagból`,
              note: stats.pendingCount > 0 ? `${stats.pendingCount} tag még nem kezdte el` : "Mindenki kész!",
              noteHighlight: false,
            },
            {
              label: "csapatkép",
              value: stats.teamMapUnlocked ? "elérhető" : `${Math.max(0, 3 - stats.completedCount)} hiányzik`,
              sub: stats.teamMapUnlocked ? "minimum teljesítve" : "3 kitöltés kell",
              note: stats.teamMapUnlocked ? "Radar diagram feloldva" : `${stats.completedCount} / 3 minimum`,
              noteHighlight: stats.teamMapUnlocked,
            },
            {
              label: "observer párok",
              value: "0",
              sub: "aktív visszajelzés",
              note: "Csapatkép után elérhető",
              noteHighlight: false,
            },
          ].map((s, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border border-[#e8e4dc] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-[#c8410a] opacity-0 transition-opacity group-hover:opacity-100" />
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a09a90]">{s.label}</p>
              <p className="mt-2 font-playfair text-[32px] leading-none text-[#1a1814]">{s.value}</p>
              <p className="mt-1 text-[12px] text-[#7a756e]">{s.sub}</p>
              <div className="mt-3 border-t border-[#e8e4dc] pt-3 text-[11px] text-[#a09a90]">
                {s.noteHighlight ? (
                  <span className="text-[#1a5c3a] font-medium">{s.note}</span>
                ) : (
                  s.note
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Team Table ── */}
        {firstTeam && firstTeam.members.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e8e4dc] px-7 py-5">
              <div>
                <h3 className="font-playfair text-[16px] text-[#1a1814]">{firstTeam.name}</h3>
                <p className="text-[12px] text-[#a09a90]">
                  {firstTeam.members.length} tag · {firstTeam.members.filter((m) => m.assessmentDone).length} kész ·{" "}
                  {firstTeam.members.filter((m) => !m.assessmentDone).length} várakozik
                </p>
              </div>
              {inviteUrl && (
                <button onClick={() => handleCopy(inviteUrl)} className={btnSm}>
                  {copied ? "✓ Másolva!" : "Meghívó másolás"}
                </button>
              )}
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e8e4dc] bg-[#faf9f6]/60">
                  {["Tag", "Státusz", "Átlagos eredmény", "Csatlakozás"].map((h) => (
                    <th key={h} className="px-7 py-3 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-[#a09a90]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firstTeam.members.map((member) => (
                  <tr key={member.userId} className="border-b border-[#e8e4dc] transition-colors hover:bg-[#faf9f6]/70 last:border-b-0">
                    <td className="px-7 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                          style={{ background: avatarColor(member.username) }}
                        >
                          {initials(member.username)}
                        </div>
                        <span className="text-[13px] font-medium text-[#1a1814]">{member.username}</span>
                      </div>
                    </td>
                    <td className="px-7 py-3.5">
                      {member.assessmentDone ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,92,58,0.2)] bg-[rgba(26,92,58,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-[#1a5c3a]">
                          ✓ kész
                        </span>
                      ) : member.joinedAt ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(200,65,10,0.2)] bg-[rgba(200,65,10,0.08)] px-2.5 py-0.5 font-mono text-[10px] text-[#c8410a]">
                          ⟳ folyamatban
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e4dc] bg-[rgba(160,154,144,0.1)] px-2.5 py-0.5 font-mono text-[10px] text-[#a09a90]">
                          meghívva
                        </span>
                      )}
                    </td>
                    <td className="px-7 py-3.5">
                      {member.assessmentScore !== null ? (
                        <div className="flex items-center gap-2.5">
                          <div className="h-1 w-14 overflow-hidden rounded-full bg-[#e8e4dc]">
                            <div
                              className="h-full rounded-full bg-[#c8410a] transition-all"
                              style={{ width: `${member.assessmentScore}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#3d3a35]">{member.assessmentScore}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#a09a90]">–</span>
                      )}
                    </td>
                    <td className="px-7 py-3.5 text-[12px] text-[#a09a90]">
                      {formatDate(member.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Invite Banner ── */}
        {inviteUrl && (
          <div className="relative overflow-hidden rounded-2xl bg-[#1a1814] p-7 md:p-8">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(200,65,10,0.3) 0%, transparent 70%)" }}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[rgba(250,249,246,0.45)]">
              // meghívó link
            </p>
            <h3 className="mt-2 font-playfair text-[18px] text-[#faf9f6]">Hívd meg a csapatod</h3>
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
                className="flex-shrink-0 rounded-lg bg-[#c8410a] px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#a8340a]"
              >
                {copied ? "✓ Másolva!" : "Másolás"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
