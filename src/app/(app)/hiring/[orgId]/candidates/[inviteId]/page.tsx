import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { extractDimensionScores } from "@/lib/scoring";
import { runProfileEngine } from "@/lib/profile-engine";
import {
  DIM_LABELS,
  CATEGORY_LABELS,
  RESOLUTION_NARRATIVES,
  RISK_TEXTS,
} from "@/lib/profile-content";
import type { Locale } from "@/lib/profile-content";
import { HEXACO_DIMENSIONS, HEXACO_ORDER, type HexacoCode } from "@/lib/hexaco";
import { diffStandardError } from "@/lib/psychometrics";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import type { AssessmentForm } from "@/lib/questions/types";
import { t } from "@/lib/i18n";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { RadarLegendNote } from "@/components/dashboard/RadarLegendNote";
import { calculateTeamRoleScores, getTopRoles, TEAM_ROLES } from "@/lib/team-role-scoring";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { DIMENSION_STRONG, EVAL_RAMP, dimColors } from "@/lib/color-system";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { EditorialBackControl } from "@/components/ui/primitives/EditorialBackHeader";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Jelölt eredménye | trita", robots: { index: false } };
}

// Kanonikus HEXACO-paletta (color-system.ts). A korábbi helyi térkép a
// státusz-színeket keverte az adat-térbe (O = hiba-piros!) — kivezetve.
// A fehér betűs kitöltött badge-ek STRONG-on ülnek (AA), a sáv/radar BASE-en.
const DIM_COLORS: Record<string, string> = DIMENSION_STRONG;

// Csapatátlag-küszöb: ennyi kitöltött önértékelés alatt az "átlag" egy-két
// ember profilját tükrözné, nem a csapatét.
const TEAM_AVG_MIN_MEMBERS = 3;

function getDimensionInsight(
  dim: string,
  category: "high" | "medium" | "low",
  locale: Locale
): string {
  const insights: Record<string, Record<string, Record<Locale, string>>> = {
    H: {
      high: {
        hu: "Etikus, szabálykövető. Nem hajlamos manipulációra, transzparens kommunikátor. Jó compliance, audit és bizalmi pozíciókban.",
        en: "Ethical, rule-following. Not prone to manipulation, transparent communicator. Strong in compliance, audit, and trust-based roles.",
      },
      medium: {
        hu: "Kiegyensúlyozott etikai érzék. Képes kompromisszumokra, de nem kerüli el a konfrontációt sem.",
        en: "Balanced ethical sense. Capable of compromise without avoiding confrontation.",
      },
      low: {
        hu: "Pragmatikus, eredményorientált. Képes 'eladni' és tárgyalni, de érdemes figyelni a transzparenciára csapatban.",
        en: "Pragmatic, results-oriented. Good at selling and negotiating, but watch transparency in team settings.",
      },
    },
    // 2026-08-11, valencia-revízió (kanonikus kapu: src/lib/score-valence.ts):
    // az Emocionalitás egyik pólusa sem erősség és nem is hiányosság —
    // különösen egy ÉRTÉKELŐ (jelölt-)felületen nem, ahol a mondat felvételi
    // döntést támogat. A korábbi szöveg empátiát és mások-olvasási pontosságot
    // tulajdonított a magas pólusnak (a facetek: Félelem · Szorongás ·
    // Dependencia · Érzelmi kötődés — ezek egyike sem ezt méri), az
    // alacsonyat pedig érzelem-vaksággal vádolta. Mindhárom sáv leíró, és a
    // hozadék mellett az árát is kimondja.
    E: {
      high: {
        hu: "Érzelmileg érzékeny: korán megérzi a helyzetek töltetét, és sokáig viszi magával. Stressz után lassabban regenerálódik – a kiszámítható tempó és a rendszeres visszajelzés segíti.",
        en: "Emotionally sensitive: registers the charge of a situation early and carries it for a while. Recovers more slowly after stress – a predictable tempo and regular feedback help.",
      },
      medium: {
        hu: "Vegyes érzelmi intenzitás: a kapcsolati jelzések eljutnak hozzá, és nyomás alatt is működőképes marad.",
        en: "Mixed emotional intensity: relational signals reach them, and they stay functional under pressure.",
      },
      low: {
        hu: "Tárgyszerű, nyomás alatt is stabil. Cserébe mások érzelmi jelzéseit ritkábban veszi észre, és a nyugalmát távolságtartásnak olvashatják.",
        en: "Matter-of-fact, steady under pressure. In exchange, they register others' emotional signals less often, and their calm can be read as distance.",
      },
    },
    X: {
      high: {
        hu: "Energikus, társaságkedvelő. Természetes facilitátor és csapatépítő. Ideális ügyfélkapcsolati vagy vezetői pozícióban.",
        en: "Energetic, sociable. Natural facilitator and team builder. Ideal for client-facing or leadership roles.",
      },
      medium: {
        hu: "Rugalmasan mozog egyéni és csoportos munka között. Szituációtól függően vezet vagy háttérbe húzódik.",
        en: "Flexibly moves between solo and group work. Leads or steps back depending on the situation.",
      },
      low: {
        hu: "Mélyen fókuszáló, introvertált. Jól dolgozik önállóan, deep work-ben. Csapat megbeszéléseken lehet kevésbé aktív.",
        en: "Deeply focused, introverted. Excels in solo work and deep focus. May be less vocal in team meetings.",
      },
    },
    // 2026-08-11, valencia-revízió (a E-döntés kiterjesztése): a Barátságosság
    // facetjei a Megbocsátás · Gyengédség · Rugalmasság · Türelem — a skála
    // toleranciát és indulat-kontrollt mér, NEM empátiát, és nem is
    // versengést. Egy ÉRTÉKELŐ (jelölt-)felületen ez különösen fontos: a
    // mondat felvételi döntést támogat. Mindkét pólus leíró és kétoldalú.
    A: {
      high: {
        hu: "Türelmes, elnéző: könnyen megbocsát és rugalmasan köt kompromisszumot. Cserébe a saját ellenvéleményét háttérbe szoríthatja, ezért a kritikáját érdemes külön kikérni.",
        en: "Patient and lenient: forgives easily and compromises flexibly. In exchange, they may keep their own objection to themselves, so their criticism is worth asking for explicitly.",
      },
      medium: {
        hu: "Kompromisszumkész, de képes a saját pozícióját képviselni. Jó egyensúly az engedékenység és az assertivitás között.",
        en: "Ready to compromise while still able to hold their own position. A good balance between accommodation and assertiveness.",
      },
      low: {
        hu: "Egyenes, vitaképes: hamar szóvá teszi, ami nem stimmel, és kitart az álláspontja mellett – értékes ott, ahol őszinte visszajelzés és határozott képviselet kell. Cserébe a viták gyorsabban éleződhetnek, és provokációra hamar elfogy a türelme.",
        en: "Direct and debate-ready: names what doesn't add up early and holds their position – valuable where honest feedback and a firm stance are the job. In exchange, debates can sharpen faster, and patience runs out quickly under provocation.",
      },
    },
    C: {
      high: {
        hu: "Rendszerezett, precíz, megbízható. Határidőket tart, részletekre figyel. Ideális projektvezetői vagy ops pozícióban.",
        en: "Organized, precise, reliable. Meets deadlines, detail-oriented. Ideal for project management or ops roles.",
      },
      medium: {
        hu: "Elfogadható szervezettség és rugalmasság. Képes strukturáltan dolgozni, de nem merev.",
        en: "Acceptable organization with flexibility. Can work structured but not rigid.",
      },
      low: {
        hu: "Spontán, rugalmas, de kevésbé strukturált. Kreatív pozícióban erős, de projektmenedzsmentnél érdemes támogatni.",
        en: "Spontaneous, flexible but less structured. Strong in creative roles, may need support in project management.",
      },
    },
    O: {
      high: {
        hu: "Nyitott, kreatív, érdeklődő. Szeret új megközelítéseket keresni. Innovációs és stratégiai pozíciókban erős.",
        en: "Open, creative, curious. Likes exploring new approaches. Strong in innovation and strategy roles.",
      },
      medium: {
        hu: "Nyitott az újdonságra, de értékeli a bevált módszereket is. Pragmatikus újító.",
        en: "Open to novelty while valuing proven methods. Pragmatic innovator.",
      },
      low: {
        hu: "Hagyománytisztelő, bevált módszereket preferálja. Stabil, kiszámítható. Jó végrehajtói és standardizáló pozícióban.",
        en: "Traditional, prefers proven methods. Stable, predictable. Good in execution and standardization roles.",
      },
    },
  };

  return insights[dim]?.[category]?.[locale] ?? "";
}

export default async function CandidateResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; inviteId: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const [locale, { orgId, inviteId }, { team: teamParam }] = await Promise.all([
    getServerLocale(),
    params,
    searchParams,
  ]);

  // Guard (2026-07-23): csak a tanácsadói kör (ORG_CONSULTANT / platform-
  // tanácsadó / trita-admin).
  const { profileId, role: memberRole } = await requireOrgContext(orgId);
  const viewer = await prisma.userProfile.findUnique({
    where: { id: profileId },
    select: { email: true, isConsultant: true },
  });
  if (!isConsultantSurface(memberRole, viewer?.email, viewer?.isConsultant)) {
    notFound();
  }

  const isHu = locale !== "en";
  const contentLocale: Locale = locale === "en" ? "en" : "hu";

  // All teams in the org for the selector
  const orgTeams = await prisma.team.findMany({
    where: { orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Team nélkül meghívott jelölt is megnyitható — az org-kötés az orgId
  // mezőn (régi sorokon a team.orgId-n) keresztül.
  const invite = await prisma.candidateInvite.findFirst({
    where: { id: inviteId, OR: [{ orgId }, { team: { orgId } }] },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      status: true,
      teamId: true,
      includeTeamRole: true,
      team: { select: { id: true, name: true } },
      result: { select: { scores: true, testType: true, teamRoleSelections: true } },
    },
  });

  if (!invite || !invite.result) {
    redirect(`/hiring/${orgId}`);
  }

  const candidateScores = extractDimensionScores(invite.result.scores) ?? {};
  const testType = invite.result.testType ?? "TRITAN";
  // Kanonikus HEXACO-sorrend (tritan.ts) – nem helyi dim-lista.
  const dims: HexacoCode[] = HEXACO_ORDER;
  // Hiányzó dimenzió ≠ 0%: a korábbi `?? 0` egy csonka score-JSON-t valós
  // nullaként rajzolt ki (bar, radar, gap-sor). A hiányzó dimenziót kihagyjuk.
  const presentDims = dims.filter((d) => typeof candidateScores[d] === "number");

  // A kérdőív-forma a tárolt pontozás-pecsétből – pecsét nélküli (örökség)
  // sorokra a konzervatívabb rövid formával számolunk (nagyobb SEM).
  const scoresRecord = invite.result.scores as { form?: unknown } | null;
  const candidateForm: AssessmentForm = scoresRecord?.form === "full" ? "full" : "short";
  // Két FÜGGETLEN pontszám (jelölt vs csapattag-átlag) különbségének hibája:
  // √2·SEM. Azonos valódi profilok mellett az |eltérés| várható értéke
  // ~0,8·SE – ez alatt a „hasonlóság" a mérési hibán belüli megkülönböztet-
  // hetetlenség, nem kiváló egyezés; eltérést pedig csak ~1,96·SE fölött
  // állítunk. A SEM-szám a felületre nem kerül ki (2026-08-11 termékdöntés) –
  // csak a címkéket kapuzza.
  const gapSe = diffStandardError(candidateForm);
  const gapNoiseFloor = gapSe * Math.sqrt(2 / Math.PI);
  const assertableGap = 1.96 * gapSe;

  // ÉRTÉKELŐ felület: a pár-hangnem a valencia-kapun (score-valence) ezzel a
  // kontextussal dől el. A jelölt-oldalon a feloldás-párok zöld „Erősség",
  // a risk-párok narancs „Figyelendő" badge-et kapnak – a fordított skálát
  // (Emocionalitás) érintő párok EGYIKBE SEM valók, azok semleges
  // „Jellemző mintázat" panelre kerülnek (tone: "note").
  const profileOutput = runProfileEngine(candidateScores, testType, "evaluative");

  // All high/low dims for the summary block.
  // E (Emocionalitás) FORDÍTOTT irányú: a magas pólus (érzelmi ráhangolódás)
  // NEM „erősség", az alacsony (érzelmi stabilitás) NEM „figyelendő". Ezért a
  // valenciás erősség/figyelendő gyorsösszegzőből kizárjuk – különben egy
  // stabil, stressztűrő jelölt (E alacsony) stabilitása a narancs
  // „figyelendő" panelbe, egy reaktív jelölté a zöld „erősség" panelbe kerülne
  // (fordított döntéstámogatás). A pólus-tudatos dimenzió-szöveg lentebb külön,
  // helyesen jeleníti meg az emocionalitást.
  // A szűrés a KANONIKUS valencia-kapun megy (score-valence.ts) – a korábbi
  // kézi `d !== "E"` literál pontosan az a minta volt, amitől a szabály
  // felületenként szétcsúszott. Üres lista esetén a panel a
  // „kiegyensúlyozott profil" / „nincs figyelendő terület" szöveget adja,
  // tehát nem marad cím tartalom nélkül.
  const highDims = presentDims.filter(
    (d) => strengthSlotEligible(d, "evaluative") && profileOutput.categories[d] === "high",
  );
  const lowDims = presentDims.filter(
    (d) => deficitSlotEligible(d) && profileOutput.categories[d] === "low",
  );

  // Selected team: searchParam → invite's team → first org team
  const selectedTeamId =
    teamParam && orgTeams.some((t) => t.id === teamParam)
      ? teamParam
      : invite.teamId && orgTeams.some((t) => t.id === invite.teamId)
        ? invite.teamId
        : orgTeams[0]?.id ?? null;

  const selectedTeam = orgTeams.find((t) => t.id === selectedTeamId) ?? null;

  // Fetch team members' scores for comparison
  let teamAvg: Record<string, number> | null = null;
  let teamValidCount = 0;
  if (selectedTeamId) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: selectedTeamId },
      select: {
        user: {
          select: {
            assessmentResults: {
              where: { isSelfAssessment: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { scores: true },
            },
          },
        },
      },
    });

    const validScores: Record<string, number>[] = teamMembers
      .map((m) => extractDimensionScores(m.user.assessmentResults[0]?.scores))
      .filter(
        (s): s is Record<string, number> =>
          !!s && dims.every((d) => typeof s[d] === "number")
      );

    teamValidCount = validScores.length;
    if (validScores.length >= TEAM_AVG_MIN_MEMBERS) {
      const sums: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0 };
      for (const s of validScores) {
        for (const d of dims) sums[d] += s[d];
      }
      teamAvg = {};
      for (const d of dims) teamAvg[d] = Math.round(sums[d] / validScores.length);
    }
  }

  // Gap analysis – sorted by absolute gap descending. Csak a jelöltnél TÉNYLEG
  // mért dimenziókra: a hiányzó dim 0-ként −50 körüli hamis gapet adna.
  const gapAnalysis = teamAvg && presentDims.length > 0
    ? presentDims
        .map((d) => ({
          dim: d,
          label: DIM_LABELS[d]?.[contentLocale] ?? d,
          candidate: candidateScores[d],
          team: teamAvg![d],
          gap: candidateScores[d] - teamAvg![d],
        }))
        .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    : null;

  // Mért csapatszerepek – ha a jelölt kitöltötte az opcionális kérdőívet.
  // Forrás-jelölés kötelező (mért vs. becsült) – termék-hitelességi elv.
  const teamRoleSelections =
    (invite.result.teamRoleSelections as TeamRoleSelections | null) ?? null;
  const measuredRoles =
    teamRoleSelections && Object.keys(teamRoleSelections).length > 0
      ? getTopRoles(calculateTeamRoleScores(teamRoleSelections), 3)
      : null;
  const roleRankLabels = isHu
    ? ["Elsődleges", "Másodlagos", "Harmadik"]
    : ["Primary", "Secondary", "Tertiary"];

  const displayName =
    invite.name ?? invite.email ?? t("hiring.unnamedCandidateFull", locale);
  const heroTheme = SURFACE_HERO_THEME.candidate;

  return (
    <PlatformPageShell surface="team" contentClassName="max-w-5xl gap-6 px-4 py-10">
      <EditorialBackControl
        href={`/hiring/${orgId}`}
        backLabel={t("hiring.backHiring", locale)}
      />

      {/* ═══ HERO – candidate (terrakotta) variáns ═══ */}
      <SurfaceHero
        variant="candidate"
        eyebrow={(
          <SectionEyebrow tone="candidateOnDark">
            {t("hiring.candidateResultEyebrow", locale)}
          </SectionEyebrow>
        )}
        badge={(
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide"
            style={{ backgroundColor: heroTheme.badgeBg, color: heroTheme.badgeText }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {t("hiring.statusCompleted", locale)}
          </span>
        )}
        title={(
          <h1 className="font-fraunces text-title tracking-tight text-[var(--color-text-on-inverse)] md:text-display">
            {displayName}
          </h1>
        )}
        meta={
          invite.position || invite.team ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {invite.position && (
                <span className="text-caption text-[var(--color-text-on-inverse-muted)]">{invite.position}</span>
              )}
              {invite.team && (
                <span className="text-note text-[var(--color-text-on-inverse-muted)]">
                  {t("hiring.assignedTeam", locale)}{invite.team.name}
                </span>
              )}
            </div>
          ) : undefined
        }
        chips={
          measuredRoles && measuredRoles.length > 0 ? (
            <span className="rounded-full bg-white/[0.08] px-3 py-1.5 text-note font-medium text-[var(--color-text-on-inverse-muted)]">
              {t("hiring.teamRolesTitle", locale)} · {t("hiring.measuredBadge", locale)}
            </span>
          ) : undefined
        }
      />

      {/* Team selector */}
      {orgTeams.length > 0 && (
        <div>
          <SectionEyebrow tone="muted" className="mb-2">
            {t("hiring.compareWithTeam", locale)}
          </SectionEyebrow>
          <div className="flex flex-wrap gap-2">
            {orgTeams.map((team) => {
              const isSelected = team.id === selectedTeamId;
              return (
                <Link
                  key={team.id}
                  href={`?team=${team.id}`}
                  className={[
                    "inline-flex min-h-[44px] items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-accent-candidate bg-accent-candidate text-[var(--color-text-on-candidate)]"
                      : "border-sand bg-surface-card text-ink-body hover:border-accent-candidate-border hover:text-accent-candidate",
                  ].join(" ")}
                >
                  {team.name}
                  {team.id === invite.teamId && (
                    <span className={`ml-1.5 text-micro ${isSelected ? "opacity-70" : "text-muted"}`}>
                      ★
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          {selectedTeam && !teamAvg && (
            <p className="mt-2 text-xs text-muted">
              {teamValidCount > 0
                ? t("hiring.notEnoughTeamData", locale).replace(
                    "{min}",
                    String(TEAM_AVG_MIN_MEMBERS),
                  )
                : t("hiring.noAssessments", locale).replace("{name}", selectedTeam.name)}
            </p>
          )}
        </div>
      )}

      {/* ① VEZETŐI ÖSSZEFOGLALÓ */}
      <DashboardPanel className="p-6 md:p-8">
          <SectionEyebrow tone="bronze" className="mb-1.5">
            {t("hiring.managerSummaryEyebrow", locale)}
          </SectionEyebrow>
          <h2 className="mb-4 font-fraunces text-heading text-ink">
            {t("hiring.quickOverview", locale)}
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Erősségek */}
            <div className="rounded-xl bg-[rgba(26,92,58,0.06)] p-4">
              <p className="mb-2 font-mono text-micro uppercase tracking-widest text-sage">
                {t("hiring.strengthsEyebrow", locale)}
              </p>
              <div className="space-y-1.5">
                {highDims.length > 0 ? (
                  highDims.map((d) => (
                    <p key={d} className="text-sm text-ink">
                      <span className="font-semibold">{DIM_LABELS[d]?.[contentLocale] ?? d}</span>
                      <span className="text-ink-body">
                        {" – "}{CATEGORY_LABELS.high[contentLocale]}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-muted">
                    {t("hiring.balancedProfile", locale)}
                  </p>
                )}
              </div>
            </div>

            {/* Figyelendő területek */}
            <div className="rounded-xl bg-[rgba(200,65,10,0.06)] p-4">
              <p className="mb-2 font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                {t("hiring.watchAreasEyebrow", locale)}
              </p>
              <div className="space-y-1.5">
                {lowDims.length > 0 ? (
                  lowDims.map((d) => (
                    <p key={d} className="text-sm text-ink">
                      <span className="font-semibold">{DIM_LABELS[d]?.[contentLocale] ?? d}</span>
                      <span className="text-ink-body">
                        {" – "}{CATEGORY_LABELS.low[contentLocale]}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-muted">
                    {t("hiring.noLowArea", locale)}
                  </p>
                )}
              </div>
            </div>

            {/* Team Fit */}
            <div className="rounded-xl bg-accent-candidate-soft/45 p-4">
              <p className="mb-2 font-mono text-micro uppercase tracking-widest text-accent-candidate">
                {t("hiring.teamFitEyebrow", locale)}
              </p>
              {gapAnalysis ? (() => {
                const avgAbsGap = Math.round(
                  gapAnalysis.reduce((sum, g) => sum + Math.abs(g.gap), 0) / gapAnalysis.length
                );
                // Mérési-hiba-tudatos címkézés: a korábbi nyers vágások
                // (<10 „kiváló", <20 „jó") a mérési hibán BELÜL jártak – a mért
                // SEM≈7,6 mellett azonos valódi profilok is ~8-9 pontos átlagos
                // |gapet| adnak. Eltérést csak akkor állítunk, ha legalább egy
                // dimenzió gapje ~1,96·SE fölött van; a zaj-padló alatti
                // hasonlóság pedig „a mérési hibán belül egyezik" – nem
                // hamis precizitású „kiváló egyezés".
                const significantGaps = gapAnalysis.filter(
                  (g) => Math.abs(g.gap) > assertableGap,
                );
                const fitLevel =
                  significantGaps.length > 0
                    ? "divergent"
                    : avgAbsGap <= gapNoiseFloor
                      ? "withinError"
                      : "good";
                // A címke HASONLÓSÁGOT mond, nem alkalmasságot: az eltérő
                // profil kiegészítő is lehet, ezért nem kap minősítést.
                // Értékelő ramp (color-system EVAL_RAMP): zsálya→bronz→neutrális
                const fitLabels = {
                  withinError: { key: "hiring.similarityWithinError", color: EVAL_RAMP.high.accent },
                  good: { key: "hiring.similarityMid", color: EVAL_RAMP.mid.fg },
                  divergent: { key: "hiring.similarityLow", color: EVAL_RAMP.low.fg },
                } as const;
                const fit = fitLabels[fitLevel];
                const topGap = gapAnalysis[0];
                return (
                  <>
                    <p className="text-lg font-semibold" style={{ color: fit.color }}>
                      {t(fit.key, locale)}
                    </p>
                    <p className="mt-1 text-xs text-ink-body">
                      {t("hiring.avgDeviation", locale).replace("{points}", String(avgAbsGap))}
                    </p>
                    {/* A „legnagyobb eltérés" is csak a mérési hibán túl állítás. */}
                    {topGap && Math.abs(topGap.gap) > assertableGap && (
                      <p className="mt-1 text-xs text-muted">
                        {t("hiring.largestGap", locale)
                          .replace("{label}", topGap.label)
                          .replace("{gap}", `${topGap.gap > 0 ? "+" : ""}${topGap.gap}`)}
                      </p>
                    )}
                  </>
                );
              })() : (
                <p className="text-xs text-muted">
                  {teamValidCount > 0
                    ? t("hiring.notEnoughTeamData", locale).replace(
                        "{min}",
                        String(TEAM_AVG_MIN_MEMBERS),
                      )
                    : t("hiring.teamComparisonNA", locale)}
                </p>
              )}
            </div>
          </div>
      </DashboardPanel>

      {/* ② SZEMÉLYISÉGPROFIL + ÉRTELMEZÉS */}
      <DashboardPanel className="p-6 md:p-8">
          <SectionEyebrow tone="bronze" className="mb-1.5">
            {t("hiring.tritanProfileEyebrow", locale)}
          </SectionEyebrow>
          <h2 className="mb-6 font-fraunces text-heading text-ink">
            {t("hiring.personalityProfile", locale)}
          </h2>

          <div className="flex flex-col gap-4">
            {presentDims.map((d) => {
              const score = Math.round(candidateScores[d]);
              const category = profileOutput.categories[d] ?? "medium";
              const teamVal = teamAvg ? Math.round(teamAvg[d]) : null;
              const color = DIM_COLORS[d];
              const dimLabel = DIM_LABELS[d]?.[contentLocale] ?? d;
              const insight = getDimensionInsight(d, category, contentLocale);

              return (
                <div
                  key={d}
                  className="rounded-xl border border-warm-mid p-4 transition hover:bg-cream/50"
                >
                  <div className="mb-2 flex items-center gap-3">
                    {/* HEXACO-betű, NEM a belső dim-kód (H/E/…) – a
                        teljes címke mellette áll, a badge a kanonikus betű. */}
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-micro font-bold text-white"
                      style={{ background: color }}
                    >
                      {HEXACO_DIMENSIONS[d].letter}
                    </div>
                    <span className="text-sm font-semibold text-ink">{dimLabel}</span>
                    <span
                      className={[
                        "ml-auto rounded-full px-2 py-0.5 text-micro font-semibold",
                        category === "high"
                          ? "bg-[rgba(26,92,58,0.08)] text-sage"
                          : category === "low"
                            ? "bg-[rgba(200,65,10,0.08)] text-[var(--color-accent-primary-strong)]"
                            : "bg-warm text-ink-body",
                      ].join(" ")}
                    >
                      {score}% · {CATEGORY_LABELS[category][contentLocale]}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="relative mb-2 h-3 overflow-hidden rounded-full bg-warm-mid">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, background: dimColors(d).base, opacity: 0.85 }}
                    />
                    {teamVal !== null && (
                      <div
                        className="absolute top-0 h-3 w-0.5 rounded-full bg-[var(--color-ink-body)]/40"
                        style={{ left: `${teamVal}%` }}
                        title={`${t("hiring.teamAvgTooltip", locale)}: ${teamVal}%`}
                      />
                    )}
                  </div>

                  {insight && (
                    <p className="text-xs leading-relaxed text-ink-warm">{insight}</p>
                  )}
                </div>
              );
            })}
          </div>

      </DashboardPanel>

      {/* ③ TEAM FIT VIZUALIZÁCIÓ */}
      {teamAvg && gapAnalysis && (
        <DashboardPanel className="p-6 md:p-8">
            <SectionEyebrow tone="bronze" className="mb-1.5">
              {t("hiring.teamFitEyebrow", locale)}
            </SectionEyebrow>
            <h2 className="mb-6 font-fraunces text-heading text-ink">
              {t("hiring.candidateInTeam", locale)}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Radar chart – candidate vs team overlay */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[280px]">
                  <RadarChart
                    uid="candidate-vs-team"
                    dimensions={presentDims.map((d) => ({
                      code: d,
                      color: dimColors(d).base,
                      score: candidateScores[d],
                      observerScore: teamAvg![d],
                    }))}
                    showObserver={true}
                  />
                  <RadarLegendNote
                    selfLabel={displayName}
                    observerLabel={selectedTeam ? selectedTeam.name : t("hiring.teamAvgTooltip", locale)}
                  />
                </div>
              </div>

              {/* Gap analysis */}
              <div>
                <p className="mb-3 font-mono text-micro uppercase tracking-widest text-ink-body">
                  {t("hiring.deviationsFromTeam", locale)}
                </p>
                <div className="space-y-2">
                  {gapAnalysis.map((g) => (
                    <div key={g.dim} className="flex items-center gap-3">
                      {/* HEXACO-betű, nem a belső kód – a címke mellette áll. */}
                      <div
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-micro font-bold text-white"
                        style={{ background: DIM_COLORS[g.dim] }}
                      >
                        {HEXACO_DIMENSIONS[g.dim].letter}
                      </div>
                      <span className="w-28 truncate text-xs text-ink-body">{g.label}</span>

                      {/* Gap bar */}
                      <div className="relative flex-1">
                        <div className="h-2 w-full rounded-full bg-warm-mid">
                          <div className="absolute left-1/2 top-0 h-2 w-px bg-[#d0cbc2]" />
                          <div
                            className="absolute top-0 h-2 rounded-full transition-all"
                            style={{
                              background: g.gap > 0 ? "var(--color-action-primary-bg)" : "var(--color-accent-primary)",
                              opacity: 0.7,
                              left: g.gap > 0 ? "50%" : `${50 + (g.gap / 100) * 50}%`,
                              width: `${Math.abs(g.gap) / 2}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Bronz-magnitúdó (eval-ramp): nagyobb eltérés = mélyebb
                          bronz; kis szöveghez AA-biztos árnyalatok. A lépcsők
                          SE-tudatosak: mély bronz csak a ~1,96·SE fölött
                          (állítható eltérés), bronz az 1·SE fölött, alatta
                          zsálya (a mérési hibán belül). */}
                      <span
                        className={[
                          "w-12 text-right font-mono text-xs font-semibold",
                          Math.abs(g.gap) > assertableGap
                            ? "text-bronze-700"
                            : Math.abs(g.gap) > gapSe
                              ? "text-bronze-dark"
                              : "text-sage-dark",
                        ].join(" ")}
                      >
                        {g.gap > 0 ? "+" : ""}{g.gap}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-note leading-relaxed text-muted">
                  {t("hiring.deviationExplanation", locale)}
                </p>
              </div>
            </div>
        </DashboardPanel>
      )}

      {/* Mért csapatszerepek – opcionális 2. lépés eredménye */}
      {measuredRoles && measuredRoles.length > 0 && (
        <DashboardPanel className="p-6 md:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div>
                <SectionEyebrow tone="bronze" className="mb-1.5">
                  {t("hiring.teamRolesEyebrow", locale)}
                </SectionEyebrow>
                <h2 className="font-fraunces text-heading text-ink">
                  {t("hiring.teamRolesTitle", locale)}
                </h2>
              </div>
              {/* Forrás-jelölés (mért vs. becsült) – termék-hitelességi elv */}
              <span className="ml-auto rounded-full bg-sage/10 px-2.5 py-1 text-micro font-semibold uppercase tracking-wide text-sage-dark">
                {t("hiring.measuredBadge", locale)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr]">
              {measuredRoles.map(({ role, score }, idx) => {
                const roleMeta = TEAM_ROLES[role];
                const isPrimary = idx === 0;
                return (
                  <div
                    key={role}
                    className={`flex flex-col rounded-xl p-[18px] ${
                      isPrimary
                        ? "border-2 border-sage bg-sage-soft"
                        : "border border-sand bg-surface-card"
                    }`}
                  >
                    <span
                      className={`mb-2 self-start rounded px-2 py-[3px] text-micro font-bold uppercase tracking-wide ${
                        isPrimary
                          ? "bg-sage text-[var(--color-action-primary-fg)]"
                          : "bg-cream text-muted"
                      }`}
                    >
                      {roleRankLabels[idx]} · {score}%
                    </span>
                    <p className={`font-fraunces text-ink ${isPrimary ? "text-heading" : "text-heading"}`}>
                      {roleMeta[contentLocale]}
                    </p>
                  </div>
                );
              })}
            </div>
        </DashboardPanel>
      )}

      {/* ④ MŰKÖDÉSI MINTÁK */}
      {(profileOutput.showBlock6 || profileOutput.showBlock7 || profileOutput.showNotes) && (
        <DashboardPanel className="p-6 md:p-8">
            <SectionEyebrow tone="bronze" className="mb-1.5">
              {t("hiring.behavioralPatternsEyebrow", locale)}
            </SectionEyebrow>
            <h2 className="mb-5 font-fraunces text-heading text-ink">
              {t("hiring.characteristicDynamics", locale)}
            </h2>

            <div className="space-y-3">
              {/* Erősség pair-ek (tone: "resolution") */}
              {profileOutput.block6Pairs.map((pair) => {
                const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[contentLocale] ?? "";
                return (
                  <div
                    key={pair.contentKey}
                    className="rounded-xl border border-[rgba(26,92,58,0.1)] bg-[rgba(26,92,58,0.04)] p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="rounded px-1.5 py-0.5 text-micro font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimA] }}
                        >
                          {HEXACO_DIMENSIONS[pair.dimA as HexacoCode]?.letter ?? pair.dimA}
                        </span>
                        <span className="text-micro text-muted">+</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-micro font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimB] }}
                        >
                          {HEXACO_DIMENSIONS[pair.dimB as HexacoCode]?.letter ?? pair.dimB}
                        </span>
                      </div>
                      <span className="rounded-full bg-[rgba(26,92,58,0.08)] px-2 py-0.5 text-micro font-semibold text-sage">
                        {t("hiring.strengthBadge", locale)}
                      </span>
                    </div>
                    {narrative && (
                      <p className="text-sm leading-relaxed text-ink-body">{narrative}</p>
                    )}
                  </div>
                );
              })}

              {/* Figyelendő pair-ek (tone: "risk") – valenciát hordozó
                  dimenziókból; a fordított skálájú párok NEM ide jönnek. */}
              {profileOutput.block7Pairs.map((pair) => {
                const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[contentLocale] ?? "";
                return (
                  <div
                    key={pair.contentKey}
                    className="rounded-xl border border-[rgba(200,65,10,0.1)] bg-[rgba(200,65,10,0.04)] p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="rounded px-1.5 py-0.5 text-micro font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimA] }}
                        >
                          {HEXACO_DIMENSIONS[pair.dimA as HexacoCode]?.letter ?? pair.dimA}
                        </span>
                        <span className="text-micro text-muted">+</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-micro font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimB] }}
                        >
                          {HEXACO_DIMENSIONS[pair.dimB as HexacoCode]?.letter ?? pair.dimB}
                        </span>
                      </div>
                      <span className="rounded-full bg-[rgba(200,65,10,0.08)] px-2 py-0.5 text-micro font-semibold text-[var(--color-accent-primary-strong)]">
                        {t("hiring.watchAreaBadge", locale)}
                      </span>
                    </div>
                    {narrative && (
                      <p className="text-sm leading-relaxed text-ink-body">{narrative}</p>
                    )}
                  </div>
                );
              })}

              {/* Semleges mintázatok (tone: "note") – a fordított skálájú
                  (Emocionalitás) párok. Sem erősség, sem figyelendő: leíró
                  mintázat + a gyakorlati tanács („így érdemes ezzel
                  dolgozni"), ami korábban egyáltalán nem jutott ki erre a
                  felületre. A panel szándékosan semleges (homok/krém), hogy a
                  döntéshozó ne valenciaként olvassa. */}
              {profileOutput.notePairs.map((pair) => {
                const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[contentLocale] ?? "";
                const advice = RISK_TEXTS[pair.contentKey]?.[contentLocale] ?? "";
                return (
                  <div
                    key={pair.contentKey}
                    className="rounded-xl border border-sand bg-cream p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="rounded px-1.5 py-0.5 text-micro font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimA] }}
                        >
                          {HEXACO_DIMENSIONS[pair.dimA as HexacoCode]?.letter ?? pair.dimA}
                        </span>
                        <span className="text-micro text-muted">+</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-micro font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimB] }}
                        >
                          {HEXACO_DIMENSIONS[pair.dimB as HexacoCode]?.letter ?? pair.dimB}
                        </span>
                      </div>
                      {/* TODO(koordinator): a badge-kulcs a results-névtérben él
                          (i18n/results.ts) – az org.ts a párhuzamos kör másik
                          gazdájánál van; érdemes később `hiring.patternBadge`
                          néven átvinni. */}
                      <span className="rounded-full bg-surface-card px-2 py-0.5 text-micro font-semibold text-ink-body">
                        {t("results.howYouWorkNote", locale)}
                      </span>
                    </div>
                    {narrative && (
                      <p className="text-sm leading-relaxed text-ink-body">{narrative}</p>
                    )}
                    {advice && (
                      <p className="mt-2 text-sm leading-relaxed text-muted">{advice}</p>
                    )}
                  </div>
                );
              })}
            </div>
        </DashboardPanel>
      )}
    </PlatformPageShell>
  );
}
