"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DashboardActionCard,
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/components/dashboard/DashboardPrimitives";

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

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ["#2a5244", "#1e3d34"], ["#8a5530", "#6b3f22"], ["#4a4a5e", "#33334a"],
  ["#6366F1", "#4F46E5"], ["#0E7490", "#0C5E75"], ["#9333EA", "#7C22CB"],
] as const;

function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "most";
  if (mins < 60) return `${mins} perce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} órája`;
  return `${Math.floor(hrs / 24)} napja`;
}

function progressColor(pct: number): string {
  if (pct >= 80) return "#1D9E75";
  if (pct >= 50) return "#EF9F27";
  return "#c8410a";
}

// ── Dummy data (until real API) ────────────────────────────────────────────────

const DUMMY_HEXACO: Record<string, number> = { H: 62, E: 48, X: 71, A: 55, C: 68, O: 74 };

const HEXACO_DIMS = [
  { key: "H", name: "Őszinteség", color: "#c8410a" },
  { key: "E", name: "Emocionalitás", color: "#1D9E75" },
  { key: "X", name: "Extraverzió", color: "#378ADD" },
  { key: "A", name: "Barátságosság", color: "#EF9F27" },
  { key: "C", name: "Lelkiismeretesség", color: "#7F77DD" },
  { key: "O", name: "Nyitottság", color: "#D4537E" },
];

const ORG_HERO_GRADIENT =
  "linear-gradient(135deg, #2f4863 0%, #22374d 60%, #172737 100%)";
const ORG_HERO_PRIMARY = "#d2a36a";
const ORG_HERO_BADGE_BG = "rgba(210,163,106,0.22)";
const ORG_HERO_BADGE_TEXT = "#f4c792";

// ── Component ──────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [data, setData] = useState<OrgStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/org-status");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) return (
    <div className="flex min-h-dvh items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-sage" />
        <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Betöltés...</p>
      </div>
    </div>
  );

  if (!data) return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-4 bg-cream px-4">
      <p className="text-[13px] text-ink-body">Nem sikerült betölteni az adatokat.</p>
      <button onClick={fetchStatus} className="rounded-[10px] bg-ink px-4 py-2 text-[13px] font-semibold text-cream">Újrapróbálás</button>
    </main>
  );

  const { org, teams, stats } = data;

  // ── Derived ──────────────────────────────────────────────────────────────

  const completionRate = stats.totalMembers > 0 ? Math.round((stats.completedCount / stats.totalMembers) * 100) : 0;
  const remaining = stats.totalMembers - stats.completedCount;
  const missingMembers = teams.flatMap((t) => t.members.filter((m) => !m.assessmentDone));
  const missingCount = missingMembers.length;
  const teamsWithSnapshot = teams.filter((t) => t.members.filter((m) => m.assessmentDone).length >= 3).length;
  const teamReadinessPct = teams.length > 0 ? Math.round((teamsWithSnapshot / teams.length) * 100) : 0;
  const teamPendingCount = Math.max(teams.length - teamsWithSnapshot, 0);
  const notStarted = teams.flatMap((t) => t.members.filter((m) => !m.assessmentDone && !m.joinedAt)).length;

  // Todos
  type Todo = { severity: "red" | "amber" | "green"; title: string; desc: string; cta?: { label: string; href: string } };
  const todos: Todo[] = [];
  if (missingCount > 0) todos.push({ severity: "red", title: "Hiányzó kitöltések", desc: missingMembers.slice(0, 3).map((m) => m.username).join(" · "), cta: { label: "Emlékeztető küldése", href: `/org/${org.id}?tab=members` } });
  if (!stats.teamMapUnlocked) todos.push({ severity: "amber", title: "Visszajelzési kör nem indult", desc: "Csapatkép után indítható" });
  if (teamsWithSnapshot > 0) todos.push({ severity: "green", title: "Csapatkép megtekinthető", desc: `${teamsWithSnapshot} csapatnál elérhető`, cta: { label: "Megtekintés", href: `/team/${teams[0]?.id ?? ""}` } });

  // Activity
  const activities = teams.flatMap((t) => t.members.filter((m) => m.assessmentAt || m.joinedAt).map((m) => ({
    name: m.username, teamName: t.name, date: m.assessmentAt ?? m.joinedAt ?? "",
    type: m.assessmentDone ? "completed" as const : "joined" as const,
    desc: m.assessmentDone ? "kitöltötte a személyiségtesztet" : "csatlakozott",
  }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Insight
  const topDim = HEXACO_DIMS.reduce((a, b) => (DUMMY_HEXACO[a.key] > DUMMY_HEXACO[b.key] ? a : b));
  const lowDim = HEXACO_DIMS.reduce((a, b) => (DUMMY_HEXACO[a.key] < DUMMY_HEXACO[b.key] ? a : b));

  // Hero summary
  function getHeroSummary(): string {
    if (teamsWithSnapshot > 0 && todos.length > 0) return `A csapat képe frissül — ma ${teamsWithSnapshot} csapatnál érdemes utánkövetni.`;
    if (teamsWithSnapshot > 0) return `${teamsWithSnapshot} csapatnál elérhető a csapatkép — érdemes ma megnézni.`;
    if (todos.length > 0) return `${todos.length} nyitott teendő vár — érdemes ma elküldeni az emlékeztetőket.`;
    return "Minden csapat jó úton halad — hamarosan elérhető az első csapatkép.";
  }

  // Next step
  function getNextStep(): { text: string; ctaLabel: string; href: string } {
    const teamWithReminder = teams.find((t) => t.members.some((m) => !m.assessmentDone));
    if (teamWithReminder) return { text: `Küldd el az emlékeztetőt a ${teamWithReminder.name} csapat hiányzó tagjainak, hogy a csapatkép ezen a héten elkészülhessen.`, ctaLabel: "Emlékeztető küldése", href: `/org/${org.id}?tab=members` };
    if (teamsWithSnapshot > 0) return { text: `A csapatkép elérhető — érdemes most megnézni és megosztani a csapattal.`, ctaLabel: "Csapatkép megtekintése", href: `/team/${teams[0]?.id ?? ""}` };
    return { text: "Indíts el egy visszajelzési kört — a 360°-os visszajelzés elérhető.", ctaLabel: "Visszajelzési kör indítása", href: `/org/${org.id}?tab=campaigns` };
  }
  const nextStep = getNextStep();

  const now = new Date();
  const lastUpdated = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const heroChips = [
    `${stats.totalMembers} aktív tag`,
    `${teams.length} csapat`,
    `${teamsWithSnapshot} csapatkép kész`,
  ];
  const quickActions = [
    { icon: "✉", tone: "bronze" as const, label: `Emlékeztető küldése${missingCount > 0 ? ` (${missingCount})` : ""}`, href: `/org/${org.id}?tab=members` },
    { icon: "↻", tone: "sage" as const, label: "Observer kör indítása", href: `/org/${org.id}?tab=campaigns` },
    { icon: "↗", tone: "ink" as const, label: "Szervezeti riport", href: `/org/${org.id}` },
    { icon: "+", tone: "warm" as const, label: "Tag meghívása", href: `/org/${org.id}?tab=members` },
  ];

  const showOnboarding = teams.length === 1 && !stats.teamMapUnlocked;
  const onboardingSteps = [
    {
      title: "Első csapat létrehozva",
      done: teams.length > 0,
      detail: teams[0] ? `${teams[0].name} létrehozva` : "Csapat létrehozása szükséges",
      href: teams[0] ? `/team/${teams[0].id}` : `/org/${org.id}?tab=teams`,
      cta: teams[0] ? "Csapat megnyitása" : "Csapat létrehozása",
    },
    {
      title: "Saját profil kitöltése",
      done: stats.adminHasAssessment,
      detail: stats.adminHasAssessment ? "Kész" : "A vezetői profil még hiányzik",
      href: "/assessment",
      cta: stats.adminHasAssessment ? "Megtekintés" : "Kitöltés indítása",
    },
    {
      title: "Tagok meghívása",
      done: stats.totalMembers >= 3,
      detail: `Jelenleg ${stats.totalMembers} aktív tag`,
      href: `/org/${org.id}?tab=members`,
      cta: "Tagok kezelése",
    },
    {
      title: "Első csapatkép feloldása",
      done: stats.completedCount >= 3,
      detail: `${stats.completedCount}/3 kitöltés`,
      href: `/org/${org.id}?tab=members`,
      cta: "Haladás követése",
    },
  ];
  const onboardingDone = onboardingSteps.filter((s) => s.done).length;
  const onboardingPct = Math.round((onboardingDone / onboardingSteps.length) * 100);
  const nextOnboardingStep = onboardingSteps.find((s) => !s.done);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-8 sm:px-8">

        {/* ═══ HERO BANNER ═══ */}
        <section className="mb-6">
          <div
            className="relative overflow-hidden rounded-[30px]"
            style={{ background: ORG_HERO_GRADIENT }}
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full bg-white/[0.03]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-[#c17f4a]/10" />

            <div className="relative px-6 py-7 md:px-8 md:py-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
                      Szervezeti cockpit
                    </p>
                    <span className="rounded-md bg-white/[0.08] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/[0.55]">
                      Frissítve {lastUpdated}
                    </span>
                  </div>

                  <h1 className="mt-3 font-fraunces text-[34px] tracking-tight text-white md:text-[40px]">
                    {org.name}
                  </h1>

                  <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-white/[0.42]">
                    {getHeroSummary()}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {heroChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.62]"
                      >
                        {chip}
                      </span>
                    ))}
                    {todos.length > 0 && (
                      <span
                        className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                        style={{ backgroundColor: ORG_HERO_BADGE_BG, color: ORG_HERO_BADGE_TEXT }}
                      >
                        {todos.length} nyitott figyelmi pont
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      href={`/org/${org.id}?tab=members`}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white no-underline transition hover:brightness-110"
                      style={{ backgroundColor: ORG_HERO_PRIMARY }}
                    >
                      + Tag meghívása
                    </Link>
                    <Link
                      href={`/org/${org.id}`}
                      className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.62] no-underline transition hover:bg-white/[0.12]"
                    >
                      Riport exportálása
                    </Link>
                  </div>
                </div>

                <aside className="hidden rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-[2px] lg:block">
                  <p className="text-[9px] uppercase tracking-[2px] text-white/[0.34]">
                    Live snapshot
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">Tag</p>
                      <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{stats.totalMembers}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">Csapat</p>
                      <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{teams.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">Kész</p>
                      <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{stats.completedCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                        <span>Szervezeti kitöltés</span>
                        <span className="font-semibold text-white/[0.7]">{completionRate}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${completionRate}%`, backgroundColor: "#8ad0b4" }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/[0.45]">
                        {stats.completedCount} kész · {remaining} hátra
                      </p>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                        <span>Csapatkép készültség</span>
                        <span className="font-semibold text-white/[0.7]">{teamReadinessPct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${teamReadinessPct}%`, backgroundColor: ORG_HERO_PRIMARY }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/[0.45]">
                        {teamsWithSnapshot} kész · {teamPendingCount} vár
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        {showOnboarding && (
          <section className="mb-8">
            <DashboardPanel tone="warm" className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bronze/80">
                    onboarding
                  </p>
                  <h2 className="mt-2 font-fraunces text-[28px] leading-none tracking-tight text-ink">
                    Első csapat indulása
                  </h2>
                  <p className="mt-2 max-w-[680px] text-[13px] leading-[1.65] text-ink-body">
                    Az első csapat már létrejött. Ezen a checklisten végigmenve gyorsan eljuttok az első értelmezhető csapatképig.
                  </p>
                </div>
                <DashboardStatusChip
                  label={`${onboardingDone}/${onboardingSteps.length} kész`}
                  tone="warm"
                />
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-sage transition-all"
                  style={{ width: `${onboardingPct}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className={[
                      "rounded-[16px] border px-4 py-3",
                      step.done
                        ? "border-sage/25 bg-white"
                        : "border-sand bg-cream",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-ink">
                          {index + 1}. {step.title}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-body">{step.detail}</p>
                      </div>
                      <DashboardStatusChip
                        label={step.done ? "Kész" : "Nyitott"}
                        tone={step.done ? "sage" : "muted"}
                      />
                    </div>
                    {!step.done && (
                      <Link
                        href={step.href}
                        className="mt-2 inline-flex text-[11px] font-semibold text-bronze no-underline"
                      >
                        {step.cta} →
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {nextOnboardingStep && (
                <div className="mt-4 rounded-[14px] border border-sand bg-white px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Következő lépés</p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] text-ink">
                      {nextOnboardingStep.title}
                    </p>
                    <Link
                      href={nextOnboardingStep.href}
                      className="inline-flex min-h-[36px] items-center rounded-[9px] bg-sage px-3 text-[11px] font-semibold text-white no-underline transition hover:bg-sage-dark"
                    >
                      {nextOnboardingStep.cta}
                    </Link>
                  </div>
                </div>
              )}
            </DashboardPanel>
          </section>
        )}

        {showOnboarding ? (
          <section className="mb-8">
            <DashboardSectionHeader label="Következő modulok (hamarosan)" className="mb-4" />
            <div className="relative overflow-hidden rounded-[24px] border border-sand bg-white">
              <div className="space-y-5 p-5 blur-[2.5px]">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-sand bg-cream p-4">
                    <div className="h-3.5 w-40 rounded bg-sand" />
                    <div className="mt-3 h-3 w-full rounded bg-sand/90" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-sand/90" />
                    <div className="mt-4 h-9 w-32 rounded bg-sand" />
                  </div>
                  <div className="rounded-2xl border border-sand bg-cream p-4">
                    <div className="h-3.5 w-32 rounded bg-sand" />
                    <div className="mt-3 space-y-2">
                      <div className="h-10 w-full rounded bg-sand/90" />
                      <div className="h-10 w-full rounded bg-sand/90" />
                      <div className="h-10 w-full rounded bg-sand/90" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-28 rounded-2xl border border-sand bg-cream" />
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="h-44 rounded-2xl border border-sand bg-cream" />
                  <div className="h-44 rounded-2xl border border-sand bg-cream" />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-white/35 px-4">
                <div className="max-w-md rounded-2xl border border-sand bg-white px-5 py-4 text-center shadow-[0_12px_32px_rgba(26,26,46,0.08)]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bronze/80">
                    onboarding fókusz
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.65] text-ink-body">
                    Amíg az induló onboarding lépések nincsenek kész, a többi dashboard modul előnézet módban marad.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-8 grid gap-4 lg:grid-cols-2">
              <DashboardActionCard
                eyebrow="Ajánlott következő lépés"
                title="Ma innen érdemes továbbmenni"
                body={nextStep.text}
                cta={{ href: nextStep.href, label: nextStep.ctaLabel, tone: "soft" }}
              />

              <DashboardPanel tone="warm" className="p-5">
                <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-dark/70">
                  Gyors műveletek
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {quickActions.map((act) => (
                    <Link
                      key={act.label}
                      href={act.href}
                      className="flex items-center gap-3 rounded-[16px] border border-sand bg-white px-4 py-3 text-[13px] font-medium text-ink no-underline transition-colors hover:border-sage/25 hover:bg-cream"
                    >
                      <span className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                        act.tone === "bronze"
                          ? "bg-bronze/10 text-bronze-dark"
                          : act.tone === "sage"
                          ? "bg-sage-soft text-sage-dark"
                          : act.tone === "warm"
                          ? "bg-[#f6ead6] text-[#8a5530]"
                          : "bg-ink/8 text-ink",
                      ].join(" ")}>
                        {act.icon}
                      </span>
                      {act.label}
                    </Link>
                  ))}
                </div>
              </DashboardPanel>
            </section>

            {/* ═══ KPI ROW ═══ */}
            <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <DashboardMetricCard accent="#c17f4a" title="Kitöltési arány" value={`${completionRate}`} suffix="%" sub={`Már csak ${remaining} kitöltés hiányzik a teljes csapatképhez`} progressPct={completionRate} progressColor="#c17f4a" />
              <DashboardMetricCard accent="#1D9E75" title="Aktív tagok" value={`${stats.completedCount}`} suffix={`/${stats.totalMembers}`} sub={`${notStarted > 0 ? `${notStarted} fő még nem kezdte el` : "Mindenki elindult"}`} progressPct={stats.totalMembers > 0 ? (stats.completedCount / stats.totalMembers) * 100 : 0} progressColor="#1D9E75" />
              <DashboardMetricCard accent="#c17f4a" title="Figyelmet igényel" value={`${todos.length}`} sub={missingCount > 0 ? `Ebből ${missingCount} emlékeztető elmaradt` : "Nincs sürgős teendő"} valueColor={todos.length > 0 ? "#c17f4a" : undefined} progressPct={Math.min(todos.length * 33, 100)} progressColor="#c17f4a" />
              <DashboardMetricCard accent="#0F6E56" title="Csapatkép kész" value={`${teamsWithSnapshot}`} suffix={`/${teams.length}`} sub={teamsWithSnapshot < teams.length ? "Egy csapatnál még kevés az adat" : "Minden csapatkép elérhető"} progressPct={teams.length > 0 ? (teamsWithSnapshot / teams.length) * 100 : 0} progressColor="#0F6E56" />
            </div>

            <DashboardSectionHeader label="Vezetői fókusz" className="mb-4" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">

              <div className="flex flex-col gap-5">
                <DashboardPanel className="px-5 py-5 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-fraunces text-[24px] leading-none tracking-tight text-ink">Szervezeti személyiségprofil</p>
                      <p className="mt-2 text-[11px] leading-[1.5] text-ink-body">{stats.completedCount} értékelt tag · szervezeti átlag</p>
                    </div>
                    <Link href={`/org/${org.id}`} className="text-[12px] font-semibold text-bronze no-underline">
                      Részletes nézet →
                    </Link>
                  </div>
                  <div className="my-4 border-t border-sand" />
                  <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {HEXACO_DIMS.map((d) => <DimRing key={d.key} name={d.name} value={DUMMY_HEXACO[d.key]} color={d.color} />)}
                  </div>
                  <DashboardActionCard
                    eyebrow="Domináns csapatminta"
                    title="Strukturált Innovátor"
                    tone="warm"
                    body={
                      <>
                        Nyitott, de keretek között működő csapat. Magas {topDim.name.toLowerCase()} és {HEXACO_DIMS[4].name.toLowerCase()}, alacsonyabb {lowDim.name.toLowerCase()}.
                      </>
                    }
                    cta={{ href: `/org/${org.id}`, label: "Csapatkép megnyitása", tone: "link" }}
                  />
                </DashboardPanel>
              </div>

              <div className="flex flex-col gap-5">
                <div
                  className="rounded-[28px] px-5 py-5"
                  style={{
                    background: ORG_HERO_GRADIENT,
                  }}
                >
                  <p className="mb-2 text-[10px] uppercase tracking-[0.9px] text-white/[0.32]">Most érdemes figyelni</p>
                  <h3 className="mb-2 font-fraunces text-[24px] leading-[1.05] tracking-tight text-white">Magas {topDim.name.toLowerCase()}, alacsony {lowDim.name.toLowerCase()}</h3>
                  <p className="text-[12.5px] leading-[1.7] text-white/[0.68]">A szervezet kreatív lendülettel dolgozik, de az alacsony {lowDim.name.toLowerCase()} ({DUMMY_HEXACO[lowDim.key]}%) növelheti a belső zajt csapatközi helyzetekben.</p>
                  <Link href={`/org/${org.id}`} className="mt-4 inline-flex text-[12px] font-semibold text-[#e8a96a] no-underline">Részletes elemzés →</Link>
                </div>

                <DashboardPanel className="px-5 py-[18px]">
                  <div className="mb-3.5 flex items-center justify-between">
                    <span className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Figyelmet kér</span>
                    {todos.length > 0 && (
                      <DashboardStatusChip label={String(todos.length)} tone="bronze" />
                    )}
                  </div>
                  {todos.length === 0 ? (
                    <p className="text-[13px] text-muted">Nincs nyitott teendő!</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {todos.map((td, i) => (
                        <div key={i} className="rounded-[18px] bg-cream py-3 pl-3.5 pr-3.5" style={{ borderLeft: `2px solid ${td.severity === "red" ? "#c17f4a" : td.severity === "amber" ? "#d4a15a" : "#3d6b5e"}` }}>
                          <p className="mb-0.5 text-[13px] font-semibold text-ink">{td.title}</p>
                          <p className="text-[12px] leading-[1.5] text-ink-body">{td.desc}</p>
                          {td.cta && <Link href={td.cta.href} className="mt-1 inline-block text-[11px] font-semibold text-bronze no-underline">{td.cta.label} →</Link>}
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardPanel>
              </div>
            </div>

            <DashboardSectionHeader label="Csapatmozgás" className="mb-4 mt-8" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <DashboardPanel className="px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-fraunces text-[24px] leading-none tracking-tight text-ink">Csapatok állapota</p>
                    <p className="mt-2 text-[11px] leading-[1.5] text-ink-body">Melyik csapat hol tart most a közös képen</p>
                  </div>
                  <Link href="/team" className="text-[12px] font-semibold text-bronze no-underline">
                    Összes csapat →
                  </Link>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {teams.map((team) => {
                    const done = team.members.filter((m) => m.assessmentDone).length;
                    const total = team.members.length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const rem = total - done;
                    const snap = done >= 3;
                    const [from, to] = getAvatarColor(team.name);

                    const insight = rem > 0 && snap
                      ? `A csapatkép majdnem kész — ${rem} emlékeztető még szükséges a befejezéshez.`
                      : snap
                      ? "Csapatkép elérhető — minden tag teljesítette a kitöltést."
                      : `${rem} kitöltés szükséges a csapatképhez.`;

                    const statusLabel = snap ? "Csapatkép kész" : pct >= 50 ? "Csapatkép elérhető" : "Függőben";
                    const statusTone = snap ? "sage" : pct >= 50 ? "warm" : "rose";

                    return (
                      <Link key={team.id} href={`/team/${team.id}`} className="block rounded-[20px] border border-sand bg-cream p-4 no-underline transition-colors hover:bg-warm">
                        <div className="mb-2.5 flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white" style={{ background: `linear-gradient(135deg,${from},${to})` }}>
                              {team.name[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-ink">{team.name}</p>
                              <p className="mt-0.5 text-[11px] text-muted">{total} tag</p>
                            </div>
                          </div>
                          <DashboardStatusChip label={statusLabel} tone={statusTone} />
                        </div>
                        <div className="mb-2 h-1 overflow-hidden rounded-[3px] bg-sand">
                          <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: progressColor(pct) }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="flex-1 pr-3 text-[12px] leading-[1.55] text-ink-body">{insight}</p>
                          <span className="shrink-0 text-[12px] font-semibold text-bronze">Megnyitás →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </DashboardPanel>

              <DashboardPanel className="px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-fraunces text-[24px] leading-none tracking-tight text-ink">Legutóbbi aktivitás</p>
                    <p className="mt-2 text-[11px] leading-[1.5] text-ink-body">Elmúlt 2 hét</p>
                  </div>
                </div>
                {activities.length === 0 ? (
                  <p className="mt-4 text-[13px] text-muted">Még nincs aktivitás.</p>
                ) : (
                  <div className="mt-4 flex flex-col gap-2.5">
                    {activities.map((a, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a.type === "completed" ? "#1D9E75" : "#EF9F27" }} />
                        <div className="min-w-0">
                          <p className="text-[13px] leading-[1.55] text-ink"><strong className="font-semibold">{a.name}</strong> {a.desc}</p>
                          <p className="mt-0.5 text-[11px] text-muted">{a.teamName} · {relativeTime(a.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardPanel>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DimRing({ name, value, color }: { name: string; value: number; color: string }) {
  const c = 125.66;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 52 52" width="52" height="52" className="mx-auto">
        <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(26,46,34,0.08)" strokeWidth="5" />
        <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="5" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" transform="rotate(-90 26 26)" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="500" fill="#1a2e22">{value}</text>
      </svg>
      <p className="mt-1 text-center text-[10px] leading-tight text-muted">{name}</p>
    </div>
  );
}
