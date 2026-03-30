"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TeamMember {
  userId: string;
  username: string;
  role: string;
  joinedAt: string | null;
  assessmentDone: boolean;
  assessmentScore: number | null;
  assessmentAt: string | null;
}

interface OrgStatusResponse {
  org: { id: string; name: string; status: string; createdAt: string };
  teams: Array<{
    id: string;
    name: string;
    inviteUrl: string | null;
    members: TeamMember[];
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

// ── Avatar ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ["#2a5244", "#1e3d34"],
  ["#8a5530", "#6b3f22"],
  ["#4a4a5e", "#33334a"],
  ["#6366F1", "#4F46E5"],
  ["#0E7490", "#0C5E75"],
  ["#9333EA", "#7C22CB"],
] as const;

function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "most";
  if (mins < 60) return `${mins} perce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} órája`;
  const days = Math.floor(hrs / 24);
  return `${days} napja`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AdminDashboard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [data, setData] = useState<OrgStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/org-status");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

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
        <p className="text-sm text-ink-body">Nem sikerült betölteni az adatokat.</p>
        <button onClick={fetchStatus} className="rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white">
          Újrapróbálás
        </button>
      </main>
    );
  }

  const { org, teams, stats } = data;

  // ── Derived data ─────────────────────────────────────────────────────────

  const missingMembers = teams.flatMap((t) =>
    t.members.filter((m) => !m.assessmentDone && m.joinedAt),
  );
  const missingCount = missingMembers.length;
  const allOk = missingCount === 0 && stats.completedCount > 0;

  const teamsWithPattern = teams.filter(
    (t) => t.members.filter((m) => m.assessmentDone).length >= 3,
  ).length;

  // Build summary
  const summaryParts: string[] = [];
  if (missingCount > 0) {
    summaryParts.push(`${missingCount} terület igényel figyelmet`);
  }
  summaryParts.push(`${teamsWithPattern} csapatnál elérhető a csapatkép`);
  if (allOk) summaryParts.unshift("Minden csapatkép elérhető");
  const summary = `${teams.length} csapat · ${stats.totalMembers} tag · ${summaryParts.join(" · ")}`;

  // Activity feed from member data
  const activities = teams
    .flatMap((t) =>
      t.members
        .filter((m) => m.assessmentAt || m.joinedAt)
        .map((m) => ({
          name: m.username,
          teamName: t.name,
          date: m.assessmentAt ?? m.joinedAt ?? "",
          type: m.assessmentDone ? ("completed" as const) : ("joined" as const),
          desc: m.assessmentDone ? "kitöltötte a személyiségtesztet" : "csatlakozott",
        })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:gap-14">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-fraunces text-[28px] leading-tight text-ink md:text-[32px]">
              {org.name}
            </h1>
            <p className="mt-1.5 text-sm text-ink-body">{summary}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/org/${org.id}?tab=members`}
              className="inline-flex min-h-[40px] items-center rounded-lg bg-ink px-4 text-[13px] font-medium text-white transition hover:bg-[#2a2a3e]"
            >
              + Tag meghívása
            </Link>
            {isAdmin && (
              <Link
                href={teams[0] ? `/hiring/${org.id}` : `/org/${org.id}`}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-white px-4 text-[13px] font-medium text-ink transition hover:border-sage/40"
              >
                + Jelölt indítása
              </Link>
            )}
          </div>
        </div>

        {/* ═══ 1. ZÓNA — Figyelmet igényel ═══ */}
        <section>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-ink-body">
            {allOk ? "MINDEN RENDBEN" : "FIGYELMET IGÉNYEL"}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Hiányzó kitöltések */}
            <ActionCard
              accent={missingCount === 0 ? "#0f6e56" : "#c17f4a"}
              label="HIÁNYZÓ KITÖLTÉSEK"
              labelColor={missingCount === 0 ? "text-[#0f6e56]" : "text-[#c17f4a]"}
              value={missingCount === 0 ? "✓" : String(missingCount)}
              sub={missingCount === 0 ? "Mindenki elkezdte!" : "tag nem kezdte el"}
              detail={
                missingCount > 0
                  ? missingMembers.slice(0, 3).map((m) => m.username).join(" · ")
                  : undefined
              }
              cta={missingCount > 0 ? { label: "Emlékeztető küldése →", href: `/org/${org.id}?tab=members` } : undefined}
              okBg={missingCount === 0}
            />

            {/* Visszajelzési kör */}
            <ActionCard
              accent={stats.teamMapUnlocked ? "#0f6e56" : "#b45309"}
              label="VISSZAJELZÉSI KÖR"
              labelColor={stats.teamMapUnlocked ? "text-[#0f6e56]" : "text-amber-700"}
              value="0"
              sub="aktív visszajelzés"
              detail={stats.teamMapUnlocked ? "Observer kör indítható" : "Csapatkép után elérhető"}
              cta={stats.teamMapUnlocked ? { label: "Visszajelzési kör indítása →", href: `/org/${org.id}?tab=campaigns` } : undefined}
            />

            {/* Elérhető értékelések */}
            <ActionCard
              accent="#0E7490"
              label="ELÉRHETŐ ÉRTÉKELÉSEK"
              labelColor="text-teal-700"
              value="—"
              sub="jelölt értékelés"
              detail="Candidate add-on aktiválható"
              cta={{ label: "Csomag vásárlás →", href: "/billing" }}
            />
          </div>
        </section>

        {/* ═══ 2. ZÓNA — Csapatok ═══ */}
        <section>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-ink-body">
            CSAPATOK
          </p>
          {teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand bg-white p-10 text-center">
              <p className="text-sm text-muted">Még nincs csapat. Hozd létre az elsőt!</p>
              <Link
                href={`/org/${org.id}?tab=teams`}
                className="mt-3 inline-flex rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white"
              >
                Csapat létrehozása
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {teams.map((team) => {
                const completed = team.members.filter((m) => m.assessmentDone).length;
                const inProgress = team.members.filter((m) => !m.assessmentDone && m.joinedAt).length;
                const waiting = team.members.length - completed - inProgress;
                const pct = team.members.length > 0 ? Math.round((completed / team.members.length) * 100) : 0;
                const hasPattern = completed >= 3;
                const [from, to] = getAvatarColor(team.name);

                return (
                  <Link
                    key={team.id}
                    href={`/team/${team.id}`}
                    className="block rounded-xl border border-sand bg-white p-4 transition-all hover:border-ink/20 hover:shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                        >
                          {team.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <h3 className="text-sm font-medium text-ink">{team.name}</h3>
                      </div>
                      <span className="text-[11px] text-ink-body">{team.members.length} tag</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2 flex gap-0.5">
                      {completed > 0 && <div className="h-1.5 rounded-full bg-[#0f6e56]" style={{ flex: completed }} />}
                      {inProgress > 0 && <div className="h-1.5 rounded-full bg-amber-500" style={{ flex: inProgress }} />}
                      {waiting > 0 && <div className="h-1.5 rounded-full bg-[#c17f4a]" style={{ flex: waiting }} />}
                    </div>

                    <div className="flex justify-between text-[11px] text-ink-body">
                      <span>{completed} kész · {inProgress + waiting} hátra</span>
                      <span className={`font-medium ${pct >= 80 ? "text-[#0f6e56]" : pct >= 50 ? "text-amber-700" : "text-[#c17f4a]"}`}>
                        {pct}%
                      </span>
                    </div>

                    <div className="mt-2 border-t border-[#e8e0d3] pt-2 text-[11px]">
                      {hasPattern ? (
                        <span className="text-[#0f6e56]">Csapatkép elérhető</span>
                      ) : pct >= 80 ? (
                        <span className="text-amber-700">Csapatkép hamarosan elérhető</span>
                      ) : (
                        <span className="text-ink-body">{Math.max(0, 3 - completed)} kitöltés kell a csapatképhez</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ 3. ZÓNA — Legutóbbi aktivitás ═══ */}
        <section>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-ink-body">
            LEGUTÓBBI AKTIVITÁS
          </p>
          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-sand bg-white p-8 text-center">
              <p className="text-sm text-muted">Még nincs aktivitás. Hívd meg az első csapattagot!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8e0d3] rounded-xl border border-sand bg-white">
              {activities.map((act, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${act.type === "completed" ? "bg-[#0f6e56]" : "bg-amber-500"}`} />
                  <div className="min-w-0 flex-1 text-sm text-ink">
                    <span className="font-medium">{act.name}</span>{" "}
                    {act.desc}
                    <span className="text-ink-body"> · {act.teamName}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-ink-body">
                    {relativeTime(act.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ ZÁRÓ CTA ═══ */}
        <section
          className="rounded-2xl p-8 md:p-10"
          style={{ background: "linear-gradient(135deg, #2a5244 0%, #1e3d34 60%, #1a2e28 100%)" }}
        >
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h3 className="font-fraunces text-xl text-white">Következő lépés</h3>
              <p className="mt-1 text-sm text-white/[0.4]">
                Indíts visszajelzési kört vagy bővítsd a szervezetet új csapattal.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/org/${org.id}?tab=campaigns`}
                className="rounded-[10px] bg-[#c17f4a] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Visszajelzési kör indítása
              </Link>
              <Link
                href={`/org/${org.id}?tab=teams`}
                className="rounded-[10px] border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/5"
              >
                Új csapat
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

// ── Action Card ─────────────────────────────────────────────────────────────

function ActionCard({
  accent,
  label,
  labelColor,
  value,
  sub,
  detail,
  cta,
  okBg,
}: {
  accent: string;
  label: string;
  labelColor: string;
  value: string;
  sub: string;
  detail?: string;
  cta?: { label: string; href: string };
  okBg?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-sand border-l-[3px] rounded-l-none p-4 ${okBg ? "bg-[#eaf3de]" : "bg-white"}`} style={{ borderLeftColor: accent }}>
      <p className={`text-[11px] font-medium uppercase tracking-wide ${labelColor}`}>{label}</p>
      <p className="mt-1 font-fraunces text-[32px] leading-none text-ink">{value}</p>
      <p className="text-xs text-ink-body">{sub}</p>
      {detail && <p className="mt-2 text-[11px] text-ink-body">{detail}</p>}
      {cta && (
        <Link href={cta.href} className={`mt-1.5 inline-block text-xs font-medium ${labelColor}`}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}
