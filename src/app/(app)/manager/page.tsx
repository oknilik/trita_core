import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { withHuArticle } from "@/lib/hu-grammar";
import { getServerAuth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getManagerCockpitData } from "@/lib/manager-cockpit";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/components/dashboard/DashboardPrimitives";
import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
// A dimenzió-badge a HEXACO-betűt mutatja (H/E/X/A/C/O), nem a belső kódot —
// a közös feloldó a tritan.ts-ből jön (egy definíció, minden felület).
import { hexLetter } from "@/lib/hexaco";

function formatTimeAgo(date: Date, isHu: boolean): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return isHu ? "éppen most" : "just now";
  if (diffMin < 60) return isHu ? `${diffMin} perce` : `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return isHu ? `${diffH} órája` : `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return isHu ? `${diffD} napja` : `${diffD}d ago`;
  return date.toLocaleDateString(isHu ? "hu-HU" : "en-US", { month: "short", day: "numeric" });
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Csapatvezető cockpit | trita" : "Manager cockpit | trita",
    robots: { index: false },
  };
}

export default async function ManagerCockpitPage() {
  // getServerAuth (nem nyers Clerk auth()): a /dashboard elosztóval és a
  // requireOrgContext-tel azonos auth-út — az e2e bypass is így működik itt.
  const [locale, { userId }] = await Promise.all([getServerLocale(), getServerAuth()]);
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true },
  });
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const data = await getManagerCockpitData(profile.id, locale as "hu" | "en");
  if (!data) {
    // Nincs kezelhető csapat (pl. frissen meghívott ORG_MANAGER, még csapat
    // nélkül). NEM a /dashboard-ra dobunk vissza: a journey a manager-kontextust
    // ismét ide (/manager) irányítaná → /dashboard ↔ /manager végtelen loop
    // (befagyott képernyő, org-invite notifikáció kattintás). Konkrét, nem-loopoló
    // célra megyünk: org-cockpit (a manager látja, ott jönnek létre a csapatok),
    // vagy ha nincs org-tagság, a személyes eredmények.
    const membership = await getActiveOrgMembership(profile.id);
    redirect(membership ? `/org/${membership.orgId}` : "/profile/results");
  }

  // Egyetlen kezelt csapatnál NINCS külön cockpit (UX-audit #10): a /manager
  // tartalma a /team/[id] oldalt duplikálta — a manager közvetlenül a
  // csapatoldalra kerül. A cockpit a TÖBB csapatot kezelő manager összegzője.
  if (data.teams.length === 1) {
    redirect(`/team/${data.teams[0].teamId}`);
  }

  const isHu = locale !== "en";
  const teamCount = data.teams.length;
  const isSingleTeam = teamCount === 1;
  const totalCompletionPct = data.totalMembers > 0
    ? Math.round((data.totalCompleted / data.totalMembers) * 100)
    : 0;

  const heroTheme = SURFACE_HERO_THEME.team;

  // ── Next step resolution ──────────────────────────────────────────────────
  const weakestTeam = data.teams.find((t) => t.completionPct < 100);
  const teamWithCampaign = data.teams.find((t) => t.activeCampaign);
  const teamNeedingMembers = data.teams.find((t) => t.memberCount < 3);

  let nextStep: {
    title: string;
    description: string;
    primary: { label: string; href: string };
    secondary?: { label: string; href: string } | null;
  };

  if (teamNeedingMembers) {
    nextStep = {
      title: isHu ? "Csapat bővítése" : "Grow your team",
      description: isHu
        ? `${withHuArticle(teamNeedingMembers.teamName, { capitalize: true })} csapatnak legalább 3 tag kell a csapatképhez. Jelenleg ${teamNeedingMembers.memberCount} tag van.`
        : `${teamNeedingMembers.teamName} needs at least 3 members for team insights. Currently ${teamNeedingMembers.memberCount} members.`,
      primary: {
        label: isHu ? "Tagok meghívása" : "Invite members",
        href: `/team/${teamNeedingMembers.teamId}?tab=members`,
      },
    };
  } else if (weakestTeam && weakestTeam.completionPct < 100) {
    const missing = weakestTeam.memberCount - weakestTeam.completedCount;
    nextStep = {
      title: isHu ? "Kitöltések lezárása" : "Close pending assessments",
      description: isHu
        ? `${withHuArticle(weakestTeam.teamName, { capitalize: true })} csapatban ${missing} tag nem töltötte ki a személyiségtesztet.`
        : `${missing} members in ${weakestTeam.teamName} haven't completed the personality assessment.`,
      primary: {
        label: isHu ? "Tagok állapota" : "View member status",
        href: `/team/${weakestTeam.teamId}?tab=members`,
      },
      secondary: weakestTeam.hasPattern
        ? { label: isHu ? "Csapatkép" : "Team profile", href: `/team/${weakestTeam.teamId}?tab=profile` }
        : null,
    };
  } else if (teamWithCampaign) {
    const c = teamWithCampaign.activeCampaign!;
    nextStep = {
      title: isHu ? "Feedback kör nyomon követése" : "Track feedback round",
      description: isHu
        ? `${c.teamObserverDoneCount}/${c.teamParticipantCount} observer visszajelzés érkezett ${withHuArticle(teamWithCampaign.teamName)} csapatban.`
        : `${c.teamObserverDoneCount}/${c.teamParticipantCount} observer responses received in ${teamWithCampaign.teamName}.`,
      primary: {
        label: isHu ? "Kör megtekintése" : "View round",
        href: `/org/${data.orgId}?tab=campaigns`,
      },
    };
  } else {
    nextStep = {
      title: isHu ? "Minden rendben" : "All good",
      description: isHu
        ? "A csapataid jó állapotban vannak. Tekintsd át az eredményeket vagy indíts visszajelzési kört."
        : "Your teams are in good shape. Review results or start a feedback round.",
      primary: {
        label: isHu ? "Csapatkép megtekintése" : "View team profile",
        href: `/team/${data.teams[0].teamId}?tab=profile`,
      },
    };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      {/* ═══ HERO ═══ */}
      <SurfaceHero
        variant="team"
        eyebrow={
          <SectionEyebrow tone="onDark">
            {isHu ? "csapatvezető cockpit" : "manager cockpit"}
          </SectionEyebrow>
        }
        title={
          <h1 className="font-fraunces text-[27px] tracking-tight text-[var(--color-text-on-inverse)] md:text-[40px]">
            {isHu ? `Szia, ${profile.username?.split(" ")[0] ?? "Menedzser"}!` : `Hi, ${profile.username?.split(" ")[0] ?? "Manager"}!`}
          </h1>
        }
        summary={
          isSingleTeam
            ? (isHu
                ? `${withHuArticle(data.teams[0].teamName, { capitalize: true })} csapatod ${data.teams[0].completionPct}%-on áll.`
                : `Your ${data.teams[0].teamName} team is at ${data.teams[0].completionPct}% completion.`)
            : (isHu
                ? `${teamCount} csapatodat kezeled, összesen ${data.totalMembers} taggal.`
                : `You manage ${teamCount} teams with ${data.totalMembers} members total.`)
        }
        chips={[
          <span key="members" className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-on-inverse-muted)]">
            {data.totalMembers} {isHu ? "tag" : "members"}
          </span>,
          <span key="done" className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-on-inverse-muted)]">
            {data.totalCompleted} {isHu ? "kitöltve" : "completed"}
          </span>,
          <span key="teams" className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-on-inverse-muted)]">
            {teamCount} {isHu ? "csapat" : "teams"}
          </span>,
        ]}
        actions={
          <Link
            href={`/team/${data.teams[0].teamId}`}
            className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-[var(--color-text-on-accent)] transition hover:brightness-110"
            style={{ backgroundColor: heroTheme.primary }}
          >
            {isSingleTeam
              ? (isHu ? "Csapat áttekintése" : "View team")
              : (isHu ? "Első csapat" : "Primary team")}
          </Link>
        }
        aside={
          <>
            <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
              {isHu ? "Összesítés" : "Summary"}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{isHu ? "Kitöltöttség" : "Completion"}</p>
                <p className="mt-1 font-fraunces text-[22px] leading-none text-[var(--color-text-on-inverse)]">{totalCompletionPct}%</p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{isHu ? "Függő" : "Pending"}</p>
                <p className="mt-1 font-fraunces text-[22px] leading-none text-[var(--color-text-on-inverse)]">{data.totalMembers - data.totalCompleted}</p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{isHu ? "Meghívók" : "Invites"}</p>
                <p className="mt-1 font-fraunces text-[22px] leading-none text-[var(--color-text-on-inverse)]">{data.totalPendingInvites}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-micro text-[var(--color-text-on-inverse-muted)]">
                <span>{isHu ? "Összesített kitöltöttség" : "Overall completion"}</span>
                <span className="font-semibold text-[var(--color-text-on-inverse-muted)]">{totalCompletionPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${totalCompletionPct}%`, backgroundColor: "var(--color-sage-300)" }}
                />
              </div>
            </div>
          </>
        }
      />

      {/* ═══ CSAPATOK ═══ */}
      <section>
        <DashboardSectionHeader label={isHu ? "Csapataid" : "Your teams"} className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          {data.teams.map((team) => (
            <Link key={team.teamId} href={`/team/${team.teamId}`} className="block">
              <DashboardPanel className="p-5 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-fraunces text-[16px] text-ink">{team.teamName}</p>
                  <DashboardStatusChip
                    label={team.hasPattern ? (isHu ? "Csapatkép kész" : "Pattern ready") : `${team.completionPct}%`}
                    tone={team.hasPattern ? "sage" : team.completionPct >= 50 ? "warm" : "bronze"}
                  />
                </div>
                <div className="mt-3 flex gap-1.5">
                  {team.completedCount > 0 && <div className="h-1.5 rounded-full bg-sage" style={{ flex: team.completedCount }} />}
                  {team.memberCount - team.completedCount > 0 && <div className="h-1.5 rounded-full bg-bronze/40" style={{ flex: team.memberCount - team.completedCount }} />}
                </div>
                <p className="mt-2 text-[11px] text-ink-body">
                  {team.completedCount}/{team.memberCount} {isHu ? "tag kitöltötte" : "members completed"}
                  {team.pendingInviteCount > 0 && (
                    <> · {team.pendingInviteCount} {isHu ? "függő meghívó" : "pending invites"}</>
                  )}
                </p>
              </DashboardPanel>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ TAGOK ÁLLAPOT ═══ */}
      {data.primaryTeamData && (
        <section>
          <DashboardSectionHeader
            label={isSingleTeam
              ? (isHu ? "Csapattagok állapota" : "Team member status")
              : (isHu ? `${data.primaryTeamData.teamName} — tagok` : `${data.primaryTeamData.teamName} — members`)}
            className="mb-4"
          />
          <DashboardPanel className="divide-y divide-[var(--color-border-default)] p-0">
            {data.primaryTeamData.members.map((member) => {
              const isDone = member.scores !== null;
              const [from, to] = getAvatarGradient(member.displayName);
              const initial = getAvatarMonogram(member.displayName, { length: 1 });

              return (
                <div key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-caption font-medium text-ink">{member.displayName}</p>
                    <p className="text-micro text-ink-body">{member.role}</p>
                  </div>
                  {isDone ? (
                    <DashboardStatusChip label={isHu ? "Kitöltve" : "Done"} tone="sage" />
                  ) : (
                    <DashboardStatusChip label={isHu ? "Folyamatban" : "In progress"} tone="warm" />
                  )}
                  {isDone && member.top3Dims.length > 0 && (
                    <div className="hidden items-center gap-1 sm:flex">
                      {member.top3Dims.map((d) => (
                        <span
                          key={d.code}
                          className="rounded-full px-1.5 py-0.5 text-micro font-semibold text-white"
                          style={{ backgroundColor: d.color }}
                        >
                          {hexLetter(d.code)} {d.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </DashboardPanel>
        </section>
      )}

      {/* ═══ DYNAMICS ÖSSZEFOGLALÓ ═══ */}
      {data.primaryTeamData && data.primaryTeamData.dynamicsEdges.length > 0 && (
        <section>
          <DashboardSectionHeader label={isHu ? "Csapatdinamika" : "Team dynamics"} className="mb-4" />
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardMetricCard
              accent="var(--color-state-success-solid)"
              title={isHu ? "Hasonló profil" : "Aligned"}
              value={String(data.teams[0]?.alignedCount ?? 0)}
              sub={isHu ? "Hasonló személyiségprofilú párok" : "Pairs with similar personality profiles"}
            />
            <DashboardMetricCard
              accent="var(--color-state-info-solid)"
              title={isHu ? "Kiegészítő" : "Complementary"}
              value={String(data.teams[0]?.complementaryCount ?? 0)}
              sub={isHu ? "Eltérő de kezelhető profilok" : "Different but manageable profiles"}
            />
            <DashboardMetricCard
              accent="var(--color-state-warning-solid)"
              title={isHu ? "Potenciális súrlódás" : "Potential friction"}
              value={String(data.teams[0]?.frictionCount ?? 0)}
              sub={isHu ? "Tudatos kommunikáció szükséges" : "Conscious communication needed"}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {/* Forrás-transzparencia (termék-alapelv): a fenti számok mért és
                becsült éleket is tartalmaznak — a megoszlás itt jelenik meg. */}
            <p className="text-micro text-muted">
              {(data.teams[0]?.measuredEdgeCount ?? 0) > 0
                ? (isHu
                    ? `ebből mért (bizalmi körből): ${data.teams[0]?.measuredEdgeCount ?? 0} · profil-becslés: ${data.teams[0]?.estimatedEdgeCount ?? 0}`
                    : `measured (trust round): ${data.teams[0]?.measuredEdgeCount ?? 0} · profile estimate: ${data.teams[0]?.estimatedEdgeCount ?? 0}`)
                : (isHu
                    ? "profil-alapú becslés — még nincs mért bizalmi kör"
                    : "profile-based estimate — no measured trust round yet")}
            </p>
            <Link
              href={`/team/${data.teams[0].teamId}?tab=intelligence`}
              className="text-[12px] font-semibold text-sage transition-colors hover:text-sage-dark"
            >
              {isHu ? "Részletes dinamika térkép →" : "Detailed dynamics map →"}
            </Link>
          </div>
        </section>
      )}

      {/* ═══ UTOLSÓ ESEMÉNYEK ═══ */}
      {data.recentEvents.length > 0 && (
        <section>
          <DashboardSectionHeader label={isHu ? "Utolsó események" : "Recent events"} className="mb-4" />
          <DashboardPanel className="divide-y divide-[var(--color-border-default)] p-0">
            {data.recentEvents.map((event, i) => {
              const icon = event.kind === "assessment_completed" ? "✅"
                : event.kind === "observer_received" ? "👁"
                : "👋";
              const label = event.kind === "assessment_completed"
                ? (isHu ? "kitöltötte a személyiségtesztet" : "completed personality assessment")
                : event.kind === "observer_received"
                  ? (isHu ? "observer visszajelzést kapott" : "received observer feedback")
                  : (isHu ? "csatlakozott" : "joined");
              const date = new Date(event.timestamp);
              const ago = formatTimeAgo(date, isHu);

              return (
                <div key={`${event.kind}-${event.timestamp}-${i}`} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[14px]">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-ink">
                      <span className="font-semibold">{event.memberName}</span>{" "}
                      {label}
                    </p>
                    <p className="text-micro text-ink-body">{event.teamName}</p>
                  </div>
                  <span className="shrink-0 text-micro text-muted">{ago}</span>
                </div>
              );
            })}
          </DashboardPanel>
        </section>
      )}

      {/* ═══ JAVASOLT KÖVETKEZŐ LÉPÉS ═══ */}
      <section>
        <DashboardSectionHeader label={isHu ? "Javasolt következő lépés" : "Suggested next step"} className="mb-4" />
        <JourneyNextStepCard
          eyebrow={isHu ? "Csapatvezető teendő" : "Manager action"}
          title={nextStep.title}
          description={nextStep.description}
          primary={nextStep.primary}
          secondary={nextStep.secondary}
        />
      </section>
    </PlatformPageShell>
  );
}
