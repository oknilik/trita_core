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

// ── Component ──────────────────────────────────────────────────────────────────

export function AdminDashboard({ isAdmin = false }: { isAdmin?: boolean }) {
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
    <div className="flex min-h-dvh items-center justify-center bg-[#f5f0e8]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(26,46,34,0.15)] border-t-[#1a2e22]" />
        <p className="text-[11px] uppercase tracking-[0.6px] text-[rgba(26,46,34,0.4)]">Betöltés...</p>
      </div>
    </div>
  );

  if (!data) return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-4 bg-[#f5f0e8] px-4">
      <p className="text-[13px] text-[rgba(26,46,34,0.6)]">Nem sikerült betölteni az adatokat.</p>
      <button onClick={fetchStatus} className="rounded-lg bg-[#1a2e22] px-4 py-2 text-[13px] font-medium text-[#f5f0e8]">Újrapróbálás</button>
    </main>
  );

  const { org, teams, stats } = data;

  // ── Derived ──────────────────────────────────────────────────────────────

  const completionRate = stats.totalMembers > 0 ? Math.round((stats.completedCount / stats.totalMembers) * 100) : 0;
  const remaining = stats.totalMembers - stats.completedCount;
  const missingMembers = teams.flatMap((t) => t.members.filter((m) => !m.assessmentDone));
  const missingCount = missingMembers.length;
  const teamsWithSnapshot = teams.filter((t) => t.members.filter((m) => m.assessmentDone).length >= 3).length;
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

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[#f5f0e8]">
      <main className="mx-auto max-w-[1080px] px-4 pb-16 pt-8 sm:px-8">

        {/* ═══ HERO BANNER ═══ */}
        <section className="mb-6 flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.8px] text-[#c8410a]">Szervezeti cockpit</p>
            <h1 className="text-[28px] font-medium leading-[1.15] tracking-[-0.6px] text-[#1a2e22]">{org.name}</h1>
            <p className="mb-3.5 mt-1.5 max-w-[440px] text-[14px] leading-[1.55] text-[rgba(26,46,34,0.58)]">{getHeroSummary()}</p>
            <div className="flex flex-wrap gap-2">
              <Chip>{stats.totalMembers} aktív tag</Chip>
              <Chip>{teams.length} csapat</Chip>
              {todos.length > 0 && <Chip variant="warn">{todos.length} nyitott figyelmi pont</Chip>}
              <Chip>{teamsWithSnapshot} csapatkép kész</Chip>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 pt-2">
            <Link href={`/org/${org.id}?tab=members`} className="rounded-lg bg-[#1a2e22] px-4 py-2 text-[13px] font-medium text-[#f5f0e8] no-underline">+ Tag meghívása</Link>
            <Link href={`/org/${org.id}`} className="rounded-lg border border-[rgba(26,46,34,0.15)] bg-white px-4 py-2 text-[13px] font-medium text-[#1a2e22] no-underline">Riport exportálása</Link>
          </div>
        </section>

        {/* ═══ KPI ROW ═══ */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Kitöltési arány" value={`${completionRate}`} suffix="%" desc={`Már csak ${remaining} kitöltés hiányzik a teljes csapatképhez`} fillPct={completionRate} fillColor="#c8410a" />
          <KpiCard label="Aktív tagok" value={`${stats.completedCount}`} suffix={`/${stats.totalMembers}`} desc={`${notStarted > 0 ? `${notStarted} fő még nem kezdte el` : "Mindenki elindult"}`} fillPct={stats.totalMembers > 0 ? (stats.completedCount / stats.totalMembers) * 100 : 0} fillColor="#1D9E75" />
          <KpiCard label="Figyelmet igényel" value={`${todos.length}`} desc={missingCount > 0 ? `Ebből ${missingCount} emlékeztető elmaradt` : "Nincs sürgős teendő"} valueColor={todos.length > 0 ? "#c8410a" : undefined} fillPct={Math.min(todos.length * 33, 100)} fillColor="#c8410a" />
          <KpiCard label="Csapatkép kész" value={`${teamsWithSnapshot}`} suffix={`/${teams.length}`} desc={teamsWithSnapshot < teams.length ? "Egy csapatnál még kevés az adat" : "Minden csapatkép elérhető"} fillPct={teams.length > 0 ? (teamsWithSnapshot / teams.length) * 100 : 0} fillColor="#0F6E56" />
        </div>

        {/* ═══ MAIN 2 COLUMNS ═══ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_288px]">

          {/* ── Left ── */}
          <div className="flex flex-col gap-5">

            {/* Személyiségprofil */}
            <Card>
              <CardHeader title="Szervezeti személyiségprofil" subtitle={`${stats.completedCount} értékelt tag · szervezeti átlag`} cta={{ label: "Részletes nézet →", href: `/org/${org.id}` }} />
              <div className="my-4 border-t border-[rgba(26,46,34,0.06)]" />
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {HEXACO_DIMS.map((d) => <DimRing key={d.key} name={d.name} value={DUMMY_HEXACO[d.key]} color={d.color} />)}
              </div>
              {/* Pattern block */}
              <div className="rounded-[10px] bg-[#f8f5ef] px-[18px] py-4">
                <p className="mb-1 text-[10px] uppercase tracking-[0.7px] text-[rgba(26,46,34,0.38)]">Domináns csapatminta</p>
                <p className="mb-1 text-[15px] font-medium text-[#1a2e22]">Strukturált Innovátor</p>
                <p className="text-[12.5px] leading-[1.55] text-[rgba(26,46,34,0.55)]">Nyitott, de keretek között működő csapat — egyszerre rendszeres és ötletvezérelt. Magas {topDim.name.toLowerCase()} és {HEXACO_DIMS[4].name.toLowerCase()}, alacsonyabb {lowDim.name.toLowerCase()}.</p>
                <Link href={`/org/${org.id}`} className="mt-2.5 inline-block text-[12px] text-[#c8410a] no-underline">Csapatkép →</Link>
              </div>
            </Card>

            {/* Csapatok állapota */}
            <Card>
              <CardHeader title="Csapatok állapota" cta={{ label: "Összes csapat →", href: "/team" }} />
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

                  const statusVar: "pending" | "snapshot_available" | "snapshot_ready" = snap ? "snapshot_ready" : pct >= 50 ? "snapshot_available" : "pending";

                  return (
                    <Link key={team.id} href={`/team/${team.id}`} className="block rounded-xl bg-[#f8f5ef] p-4 no-underline transition-colors hover:bg-[#f3ede4]">
                      <div className="mb-2.5 flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white" style={{ background: `linear-gradient(135deg,${from},${to})` }}>
                            {team.name[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-[#1a2e22]">{team.name}</p>
                            <p className="mt-0.5 text-[11px] text-[rgba(26,46,34,0.42)]">{total} tag</p>
                          </div>
                        </div>
                        <StatusChip status={statusVar} />
                      </div>
                      <div className="mb-2 h-1 overflow-hidden rounded-[3px] bg-[rgba(26,46,34,0.09)]">
                        <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: progressColor(pct) }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="flex-1 pr-3 text-[12px] leading-[1.5] text-[rgba(26,46,34,0.50)]">{insight}</p>
                        <span className="shrink-0 text-[12px] text-[#c8410a]">Megnyitás →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>

            {/* Aktivitás */}
            <Card>
              <CardHeader title="Legutóbbi aktivitás" badge="elmúlt 2 hét" />
              {activities.length === 0 ? (
                <p className="mt-4 text-[13px] text-[rgba(26,46,34,0.4)]">Még nincs aktivitás.</p>
              ) : (
                <div className="mt-4 flex flex-col gap-2.5">
                  {activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a.type === "completed" ? "#1D9E75" : "#EF9F27" }} />
                      <div className="min-w-0">
                        <p className="text-[13px] leading-[1.5] text-[#1a2e22]"><strong className="font-medium">{a.name}</strong> {a.desc}</p>
                        <p className="mt-0.5 text-[11px] text-[rgba(26,46,34,0.38)]">{a.teamName} · {relativeTime(a.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Right (advisor rail) ── */}
          <div className="flex flex-col gap-5">

            {/* Insight box */}
            <div className="rounded-[14px] bg-[#1a2e22] px-[22px] py-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.9px] text-[rgba(245,240,232,0.38)]">Most érdemes figyelni</p>
              <h3 className="mb-2 text-[14px] font-medium leading-[1.35] text-[#f5f0e8]">Magas {topDim.name.toLowerCase()}, alacsony {lowDim.name.toLowerCase()}</h3>
              <p className="text-[12.5px] leading-[1.65] text-[rgba(245,240,232,0.72)]">A szervezet kreatív lendülettel dolgozik, de az alacsony {lowDim.name.toLowerCase()} ({DUMMY_HEXACO[lowDim.key]}%) növelheti a belső zajt csapatközi helyzetekben.</p>
              <Link href={`/org/${org.id}`} className="mt-3 block text-[12px] text-[#c8410a] no-underline">Részletes elemzés →</Link>
            </div>

            {/* Figyelmet kér */}
            <RailCard title="Figyelmet kér" badge={todos.length > 0 ? todos.length : undefined}>
              {todos.length === 0 ? (
                <p className="text-[13px] text-[rgba(26,46,34,0.4)]">Nincs nyitott teendő!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {todos.map((td, i) => (
                    <div key={i} className="rounded-r-lg bg-[rgba(26,46,34,0.02)] py-2.5 pl-3 pr-3" style={{ borderLeft: `2px solid ${td.severity === "red" ? "#c8410a" : td.severity === "amber" ? "#EF9F27" : "#0F6E56"}` }}>
                      <p className="mb-0.5 text-[13px] font-medium text-[#1a2e22]">{td.title}</p>
                      <p className="text-[12px] leading-[1.45] text-[rgba(26,46,34,0.45)]">{td.desc}</p>
                      {td.cta && <Link href={td.cta.href} className="mt-1 inline-block text-[11px] text-[#c8410a] no-underline">{td.cta.label} →</Link>}
                    </div>
                  ))}
                </div>
              )}
            </RailCard>

            {/* Ajánlott következő lépés */}
            <RailCard title="Ajánlott következő lépés">
              <div className="rounded-[10px] bg-[#f8f5ef] px-3.5 py-3 text-[13px] leading-[1.6] text-[rgba(26,46,34,0.65)]">
                {nextStep.text}
              </div>
              <Link href={nextStep.href} className="mt-2.5 inline-block text-[12px] text-[#c8410a] no-underline">{nextStep.ctaLabel} →</Link>
            </RailCard>

            {/* Gyors műveletek */}
            <RailCard title="Gyors műveletek" compact>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: "✉", color: "#c8410a", label: `Emlékeztető küldése (${missingCount})`, href: `/org/${org.id}?tab=members` },
                  { icon: "↻", color: "#378ADD", label: "Observer kör indítása", href: `/org/${org.id}?tab=campaigns` },
                  { icon: "↗", color: "#0F6E56", label: "Szervezeti riport", href: `/org/${org.id}` },
                  { icon: "+", color: "#7F77DD", label: "Tag meghívása", href: `/org/${org.id}?tab=members` },
                ].map((act) => (
                  <Link key={act.label} href={act.href} className="flex items-center gap-2.5 rounded-[10px] border border-[rgba(26,46,34,0.09)] bg-[#f8f5ef] px-3.5 py-2.5 text-[13px] text-[#1a2e22] no-underline transition-colors hover:bg-[rgba(26,46,34,0.06)]">
                    <span className="shrink-0 text-[14px]" style={{ color: act.color }}>{act.icon}</span>{act.label}
                  </Link>
                ))}
              </div>
            </RailCard>
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer className="pt-6 text-center text-[11px] text-[rgba(26,46,34,0.28)]">
          trita · szervezeti cockpit · © {new Date().getFullYear()}
        </footer>

      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[14px] border border-[rgba(26,46,34,0.10)] bg-white px-5 py-5 sm:px-6">{children}</div>;
}

function CardHeader({ title, subtitle, cta, badge }: { title: string; subtitle?: string; cta?: { label: string; href: string }; badge?: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[13px] font-medium text-[#1a2e22]">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-[rgba(26,46,34,0.42)]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="text-[10px] text-[rgba(26,46,34,0.4)]">{badge}</span>}
        {cta && <Link href={cta.href} className="text-[12px] text-[#c8410a] no-underline">{cta.label}</Link>}
      </div>
    </div>
  );
}

function RailCard({ title, badge, compact, children }: { title: string; badge?: number; compact?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[rgba(26,46,34,0.10)] bg-white" style={{ padding: compact ? "16px 20px" : "18px 20px" }}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#1a2e22]">{title}</span>
        {badge != null && badge > 0 && <span className="rounded-[20px] bg-[#FAECE7] px-2 py-[2px] text-[10px] font-medium text-[#993C1D]">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ label, value, suffix, desc, valueColor, fillPct, fillColor }: {
  label: string; value: string; suffix?: string; desc: string; valueColor?: string; fillPct: number; fillColor: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[rgba(26,46,34,0.10)] bg-white px-5 pb-4 pt-[18px]">
      <p className="mb-2.5 text-[11px] uppercase tracking-[0.6px] text-[rgba(26,46,34,0.4)]">{label}</p>
      <p className="text-[32px] font-medium leading-none tracking-[-1.5px]" style={{ color: valueColor ?? "#1a2e22" }}>
        {value}{suffix && <sub className="text-[15px] tracking-normal opacity-35">{suffix}</sub>}
      </p>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-[rgba(26,46,34,0.50)]">{desc}</p>
      <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-[rgba(26,46,34,0.06)]">
        <div className="h-full" style={{ width: `${Math.min(fillPct, 100)}%`, background: fillColor, borderRadius: "0 2px 0 0" }} />
      </div>
    </div>
  );
}

function DimRing({ name, value, color }: { name: string; value: number; color: string }) {
  const c = 125.66;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 52 52" width="52" height="52" className="mx-auto">
        <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(26,46,34,0.08)" strokeWidth="5" />
        <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="5" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" transform="rotate(-90 26 26)" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="500" fill="#1a2e22">{value}</text>
      </svg>
      <p className="mt-1 text-center text-[10px] leading-tight text-[rgba(26,46,34,0.5)]">{name}</p>
    </div>
  );
}

function Chip({ variant, children }: { variant?: "warn"; children: React.ReactNode }) {
  return (
    <span className={`rounded-[20px] px-3 py-[5px] text-[12px] ${
      variant === "warn"
        ? "border border-[rgba(200,65,10,0.2)] bg-[#FAECE7] text-[#993C1D]"
        : "border border-[rgba(26,46,34,0.12)] bg-[rgba(26,46,34,0.06)] text-[#1a2e22]"
    }`}>
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: "pending" | "snapshot_available" | "snapshot_ready" }) {
  const c = { pending: { l: "Függőben", bg: "#FAECE7", fg: "#993C1D" }, snapshot_available: { l: "Csapatkép elérhető", bg: "#FAEEDA", fg: "#854F0B" }, snapshot_ready: { l: "Csapatkép kész", bg: "#E1F5EE", fg: "#0F6E56" } }[status];
  return <span className="shrink-0 whitespace-nowrap rounded-[20px] px-2.5 py-[3px] text-[10px] font-medium" style={{ background: c.bg, color: c.fg }}>{c.l}</span>;
}
