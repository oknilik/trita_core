import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isConsultingLed } from "@/lib/operating-mode";
import { TeamInterestBanner } from "@/components/results/TeamInterestBanner";
import type { CareerBackground } from "@/lib/industry-fit";
import { computeCareerForProfile } from "@/lib/career/service";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { getSelfAccessLevel, type SelfAccess } from "@/lib/access";
import {
  extractDimensionScores,
  extractFacetScores,
  type ScoreResult,
} from "@/lib/scoring";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";
import { InvitationStatus, type TestType } from "@prisma/client";
import { resolvePersonalityTypeFromScores } from "@/lib/personality-type";
import { resolveObserverFlowStatus, OBSERVER_MIN_FOR_REVEAL } from "@/lib/observer-flow";
import { computeObserverAverage, computeObserverFacetAverages } from "@/lib/member-dossier";
import type { HexacoCode } from "@/lib/hexaco";
import { getJourneySnapshotForProfileId } from "@/lib/journey/service";
import { createSelfDashboardIA } from "@/lib/dashboard/ia-contract";
import { BLOCK1 } from "@/lib/profile-content";
import { DIMENSION_STRENGTH_VERBS, DIMENSION_WEAK_VERBS } from "@/lib/dimension-insights";
import { dimStandardError, facetStandardError } from "@/lib/psychometrics";
import {
  buildWorkstyleContent,
  selectGrowthFocusItems,
  selectHeroInsightDims,
} from "@/lib/workstyle-content";
import { t, type Locale } from "@/lib/i18n";

import {
  ProfileTabs,
  type ProfileViewId,
  type ReportChapterId,
} from "@/components/profile/ProfileTabs";
import {
  aggregatePeerRoleScores,
  poolPeerSelectionsByRatedMember,
} from "@/lib/team-role-peer";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
import { DashboardAutoRefresh } from "@/components/dashboard/DashboardAutoRefresh";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { resolveCompareInviteState } from "@/lib/compare-invite";
import { resolveGlyphPair } from "@/lib/type-glyph";
import type { InteractionEntryPreview } from "@/components/results/InteractionEntryCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Profilod | trita" : "Your profile | trita",
    robots: { index: false },
  };
}

type ProfileLevel = "start" | "plus";

function toProfileLevel(level: SelfAccess): ProfileLevel {
  return level === "full" ? "plus" : "start";
}

function getInsight(
  score: number,
  insights: { low: string; mid: string; high: string },
): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

export default async function ProfileResultsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) return redirectToSignIn();

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true, careerBackground: true },
  });
  if (!profile) return redirectToSignIn();

  const careerActive = isPortfolioSurfaceActive("career");
  const publicSharingActive = isPortfolioSurfaceActive("publicSharing");

  const [
    latestResult,
    accessLevelRaw,
    completedObserverAssessments,
    sentInvitationsRaw,
    receivedInvitationsRaw,
    draft,
    feedbackRecords,
    journeySnapshot,
    careerHiddenMembership,
    activeShareCount,
    rawCompareInvites,
  ] = await Promise.all([
    prisma.assessmentResult.findFirst({
      where: { userProfileId: profile.id, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, scores: true, testType: true, createdAt: true, shareToken: true },
    }),
    getSelfAccessLevel(profile.id),
    prisma.observerAssessment.findMany({
      where: {
        invitation: {
          inviterId: profile.id,
          status: InvitationStatus.COMPLETED,
        },
      },
      select: { scores: true, confidence: true },
    }),
    prisma.observerInvitation.findMany({
      where: { inviterId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        completedAt: true,
        observerEmail: true,
        observerName: true,
        observerType: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.observerInvitation.findMany({
      where: { observerProfileId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        completedAt: true,
        inviter: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assessmentDraft.findUnique({
      where: { userProfileId: profile.id },
      select: { answers: true, testType: true },
    }),
    prisma.feedback.findMany({
      where: { userProfileId: profile.id, kind: { in: ["satisfaction", "result_clarity"] } },
      select: { kind: true },
    }),
    getJourneySnapshotForProfileId(profile.id, {
      locale,
      entryPoint: "profile_results_page",
    }),
    // Org-szintű karrier-modul kapcsoló — közös szabály a /career oldallal
    // és a navigációval (module-visibility.ts). Itt már csak a PDF
    // karrier-blokkjára hat, a fül 2026-07-31 óta külön oldal.
    careerActive ? isCareerModuleHidden(profile.id) : Promise.resolve(true),
    // Élő megosztás MINDEN self-eredményen, nem csak a legutóbbin: a
    // /share/[token] bármelyik eredmény tokenjével nyílik, és a DELETE is az
    // összeset vonja vissza. Újrakitöltés után a régi eredményhez tartozó link
    // marad kint — a visszavonást ezért erre kell kötni, nem a latestResult
    // tokenjére (különben a felületről nem lenne visszavonható).
    publicSharingActive
      ? prisma.assessmentResult.count({
          where: {
            userProfileId: profile.id,
            isSelfAssessment: true,
            shareToken: { not: null },
          },
        })
      : Promise.resolve(0),
    prisma.compareInvite.findMany({
      where: { OR: [{ inviterId: profile.id }, { partnerId: profile.id }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        inviterId: true,
        partnerId: true,
        inviter: { select: { username: true } },
        partner: { select: { username: true } },
      },
    }),
  ]);

  // Karrier-illeszkedés: a szerveren, EGY forrásból — a fül kezdeti nézete és
  // a PDF-export ugyanezt az eredményt kapja. A wizard-változásokat a kliens a
  // /api/career/fit végponton számoltatja újra.
  const storedCareerBackground = profile.careerBackground as
    | (CareerBackground & { status?: string })
    | null;
  const careerResult =
    !careerActive || !CAREER_MODULE_READY || careerHiddenMembership || !storedCareerBackground?.status
      ? null
      : await computeCareerForProfile(profile.id, {
          limit: 18,
          currentIndustry: storedCareerBackground.currentIndustry ?? null,
          status: storedCareerBackground.status as "studying" | "working" | "switching" | null,
          industries: storedCareerBackground.interests ?? [],
        });

  if (!latestResult) {
    // If there's a draft in progress, show a "continue" page instead of redirecting
    // This prevents a redirect loop when user clicks "Continue later"
    const hasDraft = journeySnapshot.state.completionSummary.self.hasDraft || Boolean(draft);
    if (hasDraft) {
      return (
        <main className="-mx-4 -my-8 flex min-h-[80dvh] flex-col items-center justify-center bg-[var(--color-surface-canvas)] px-6 py-16 text-center">
          <div className="w-full max-w-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-self-accent-soft)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action-primary-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h1 className="font-fraunces text-2xl tracking-tight text-[var(--color-text-primary)] md:text-3xl">
              {t("results.draftInProgressTitle", locale)}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-body leading-relaxed text-[var(--color-text-muted)]">
              {t("results.draftInProgressBody", locale)}
            </p>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
              {t("results.draftInProgressHint", locale)}
            </p>
            <Link
              href="/assessment"
              className={getButtonClassName({
                size: "lg",
                className:
                  "mt-8 rounded-xl px-8 text-body shadow-md shadow-[var(--color-action-primary-bg)]/20 hover:-translate-y-px hover:brightness-[1.06]",
              })}
            >
              {t("results.draftInProgressCta", locale)}
            </Link>
          </div>
        </main>
      );
    }
    // Nincs eredmény és nincs draft: NEM kényszerítünk a tesztre —
    // barátságos indítóképernyő teljes navigációval (profil, blog,
    // kijelentkezés elérhető marad). A teszt ajánlott, nem kötelező.
    return (
      <main className="-mx-4 -my-8 flex min-h-[80dvh] flex-col items-center justify-center bg-[var(--color-surface-canvas)] px-6 py-16 text-center">
        <div className="w-full max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-self-accent-soft)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action-primary-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </div>
          <h1 className="font-fraunces text-2xl tracking-tight text-[var(--color-text-primary)] md:text-3xl">
            {t("results.nextStepTestTitle", locale)}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-body leading-relaxed text-[var(--color-text-muted)]">
            {t("results.nextStepTestBody", locale)}
          </p>
          <Link
            href="/assessment"
            className={getButtonClassName({
              size: "lg",
              className:
                "mt-8 rounded-xl px-8 text-body shadow-md shadow-[var(--color-action-primary-bg)]/20 hover:-translate-y-px hover:brightness-[1.06]",
            })}
          >
            {t("actions.startTest", locale)}
          </Link>
        </div>
      </main>
    );
  }

  const scores = latestResult.scores as ScoreResult;
  if (scores.type !== "likert") redirect(journeySnapshot.resolution.destination);

  // A tárolt score-JSON KANONIKUS olvasói (scoring.ts). Nyers
  // `scores.dimensions[dim.code]` hozzáférés itt hibás: a 2026-08-11 előtt
  // mentett sorok az örökség-kulcsokat (INTE/RESO/TEMP/ADAP/THOR/OPEN)
  // hordozzák, a `config.dimensions[].code` viszont már HEXACO-betű — a
  // kettő sosem találkozik, és a teljes eredményoldal üresen renderelt
  // (üres radar, üres áttekintő-strip, nincs dimenzió-akkordeon).
  const selfDimensionScores = extractDimensionScores(latestResult.scores) ?? {};
  const selfFacetScoresNormalized = extractFacetScores(latestResult.scores);

  const testType = latestResult.testType as TestType;
  const config = getTestConfig(testType, locale);
  const accessLevel = toProfileLevel(accessLevelRaw);

  // Mérési hiba a tárolt forma-pecsétből — pecsét nélküli (örökség) sorokra
  // a konzervatívabb rövid formával számolunk. A SEM BELSŐ küszöb (lapos
  // profil-kapu, facet-egyezés) — számként nem jelenik meg a felületen
  // (2026-08-11 termékdöntés).
  const assessmentForm = scores.form ?? "short";
  const dimSem = dimStandardError(assessmentForm);
  // Facet-szintű eltérés-küszöb a facet-összevetéshez: KÉT facet-pontszám
  // (self vs observer-átlag) KÜLÖNBSÉGÉNEK hibája √2·SEM, nem 1×SEM — az
  // 1×-es kapu ~40%-kal alul-becsülte, és a mérési hibán belüli facet-gapeket
  // is „eltérésnek" jelölte (motor-audit v6, M2; a dimenzió-szintű kapu,
  // DIFF_MIN_GAP, ugyanezt a √2-es szabályt követi). Kerekítve, propként megy.
  // TUDATOS KÖVETKEZMÉNY (motor-audit v9 döntés): a rövid formán 2,5 item
  // jut egy facetre, így a küszöb ≈ 17 pont — az „eltérés"-jelzés RITKÁN fog
  // tüzelni. Ez nem hiba, hanem a facet-szintű megbízhatóság őszinte kezelése:
  // a szekció egyezésnél pozitív állapotot mutat, a teljes lista egy
  // kattintásra elérhető. Pilot-α után újraértékelendő (residuals-ledger §3).
  const facetSemRounded = Math.round(Math.SQRT2 * facetStandardError(assessmentForm));

  // ── Draft info ─────────────────────────────────────────────────────────────
  const feedbackSubmitted = feedbackRecords.some((feedback) => feedback.kind === "satisfaction");
  const clarityFeedbackSubmitted = feedbackRecords.some((feedback) => feedback.kind === "result_clarity");
  const pendingInvitesCount = journeySnapshot.state.completionSummary.self.pendingInvites;
  const selfDashboardVm = createSelfDashboardIA({
    locale,
    displayName: profile.username ?? profile.email ?? "You",
    currentStage: journeySnapshot.state.currentStage,
    completionSummary: journeySnapshot.state.completionSummary,
    nextBestAction: journeySnapshot.nextBestAction,
    blockingReasons: journeySnapshot.state.blockingReasons,
    generatedAt: journeySnapshot.generatedAt,
  });

  // ── Build serialized dimensions ────────────────────────────────────────────
  const completedObservers = completedObserverAssessments.map(
    (e) => e.scores as ScoreResult,
  );
  // Külső kép reveal-küszöb: a kanonikus n≥3 (OBSERVER_MIN_FOR_REVEAL) a
  // self-serve úton is — korábban itt 2 volt. A 3-as küszöb részleges
  // mitigáció a differencia-támadásra: a célszemély a futó átlagból
  // visszafejthetné az utolsó értékelőt (r₃ = 3·avg₃ − 2·avg₂), ha az átlag
  // már n=2-nél látszana. A küszöb emelése + a completion-értesítés
  // anonimizálása (nincs értékelő-név) csökkenti a támadás felületét.
  // NEM teljes megoldás: a ratee lapozások közt továbbra is aktívan
  // differenciálhat (avg₃ → avg₄ …) az újabb értékelők beérkeztével — ezt
  // kis-N 360 mellett nem tudjuk teljesen kizárni.
  const hasObserverData = completedObservers.length >= OBSERVER_MIN_FOR_REVEAL;

  const mainDimCodes = config.dimensions
    .filter((d) => d.code !== "I")
    .map((d) => d.code);

  // Kanonikus átlagoló (member-dossier): a lefedetlen dimenzió NEM kap
  // értéket — így nem gyárt hamis 0-s „vakfoltot" az összevetésben.
  const likertObservers = completedObservers.filter((o) => o.type === "likert");
  // Az observer-készletek UGYANAZON az örökség-normalizáláson mennek át, mint
  // az önkép — különben a régi értékelések átlaga üres lenne, és az
  // összevetés „nincs külső adat" képet mutatna meglévő válaszok mellett.
  const observerAvg = computeObserverAverage(
    mainDimCodes as HexacoCode[],
    likertObservers.map((o) => extractDimensionScores(o) ?? {}),
  );

  // Facet-szintű külső átlag ugyanabból a forrásból — facetenként külön
  // küszöb (≥3 értékelő, DOSSIER_OBSERVER_MIN), a ritkán lefedett facet
  // kulcsa kimarad.
  const observerFacetAverages = computeObserverFacetAverages(
    mainDimCodes as HexacoCode[],
    likertObservers.map((o) => extractFacetScores(o) ?? undefined),
  );
  // Örökség-eredményben nincs facet-bontás — ilyenkor a facet-összevetés
  // önkép-oldala hiányzik, a szekció nem jelenhet meg.
  const selfFacetScores = selfFacetScoresNormalized;

  // Az értékelők átlagos magabiztossága (1–5) — csak a megadott értékekből,
  // és CSAK a reveal-küszöb (hasObserverData, n≥3) felett: n=1-nél a szám az
  // egyetlen értékelő saját confidence-e lenne, ami a testvér-propokkal
  // azonos anonimitás-védelmet igényel (különben az RSC-payloadban szivárog).
  const observerConfidences = completedObserverAssessments
    .map((a) => a.confidence)
    .filter((c): c is number => typeof c === "number");
  const avgObserverConfidence =
    hasObserverData && observerConfidences.length > 0
      ? Math.round(
          (observerConfidences.reduce((sum, c) => sum + c, 0) /
            observerConfidences.length) *
            10,
        ) / 10
      : null;

  // FIX 4 kiterjesztés (0 mint „nincs mérve", dimenzió-szint): a tárolt
  // score-JSON-ból hiányzó dimenzió NEM 0 pont — a korábbi `?? 0` fallback
  // valódi 0-ként renderelte („figyelendő" badge, 0-ból generált low-próza,
  // fejlődési fókusz #1, radar-behorpadás; hiányzó I-nél 0%-os
  // Segítőkészség-kártya). A nem mért dimenzió kimarad a listából — a
  // lejjebbi fogyasztók (AltruismCard find("I"), PDF-altruizmus,
  // személyiség-címke ≥2 dim szabálya) ezt hiányként kezelik, nem nullaként.
  const dimensions = config.dimensions.flatMap((dim) => {
    const score = selfDimensionScores[dim.code];
    if (typeof score !== "number") return [];
    const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
      low: string;
      mid: string;
      high: string;
    };
    return [{
      code: dim.code,
      label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
      labelByLocale: dim.labelByLocale,
      color: dim.color,
      score,
      insight: getInsight(score, insights),
      description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      descriptionByLocale: dim.descriptionByLocale,
      insights: dim.insights,
      insightsByLocale: dim.insightsByLocale,
      observerScore: hasObserverData ? observerAvg?.[dim.code] : undefined,
      // FIX 4 (0 mint „nincs mérve"): örökség-eredményben nincs facet-
      // bontás — a hiányzó érték NEM 0 pont. A korábbi `?? 0` fallback
      // 24 koholt 0-facetet renderelt és a fejlődési fókuszba is 0-kat
      // választott; a mérés nélküli facet kimarad.
      // (A korábbi aspects-leképezés törölve: a bankban nincs aspect-item,
      // a motor nem ír aspects-et — a ScoreResult.aspects csak tolerált
      // örökség-mező, megjelenítője soha nem volt.)
      facets: (dim.facets ?? []).flatMap((f) => {
        const facetScore = selfFacetScoresNormalized?.[dim.code]?.[f.code];
        if (typeof facetScore !== "number") return [];
        return [{
          code: f.code,
          label: (f.labelByLocale?.[locale] ?? f.label) as string,
          score: facetScore,
        }];
      }),
    }];
  });

  // ── Growth focus ───────────────────────────────────────────────────────────
  const mainDimensions = dimensions.filter((d) => d.code !== "I");

  // Kiválasztás a közös szabályból (workstyle-content, motor-audit v4):
  //  - a fordított E kimarad a deficit-listából (alacsony = stabilitás);
  //  - örökség-sorra (nincs facet-adat) a dimenzió-szintű fallback fut,
  //    koholt 0-facet nem kerülhet a fókuszba (a facets tömb fent már csak
  //    mért értékeket tartalmaz).
  const growthFocusItems = selectGrowthFocusItems(mainDimensions);

  // ── Serialize invitations ──────────────────────────────────────────────────
  // ── Csapatszerep: mért self-eredmény + kampányból érkező társ-visszajelzés ─
  const [teamRoleScoreRecord, myTeamMemberships] = await Promise.all([
    prisma.teamRoleScore.findFirst({
      where: { userProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      select: { scores: true, source: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: profile.id },
      select: { teamId: true },
    }),
  ]);
  const teamRoleMeasuredScores =
    teamRoleScoreRecord?.source === "questionnaire"
      ? (teamRoleScoreRecord.scores as Record<string, number>)
      : null;
  // Peer-aggregátum HATÓKÖRE (motor-audit v6, M6): a korábbi lekérdezés
  // minden observationt összeszedett `aboutUserId` szerint — csapattól,
  // szervezettől és időtől függetlenül, kilépő-védelem és self-szűrés
  // nélkül. Most a csapat-fül S4-szabályát tükrözzük: csak a user JELENLEGI
  // csapataiból származó sorok, és csak olyan értékelőtől, aki az adott
  // csapatnak MA is tagja. A dedupe/self-kizárás a kanonikus
  // poolPeerSelectionsByRatedMember-ben fut (updatedAt szerint növekvő
  // sorrend → raterenként a legutolsó kör számít, csapatokon átívelően is).
  const myTeamIds = myTeamMemberships.map((m) => m.teamId);
  const [teamRoleObservationsRaw, currentCoMembers] =
    myTeamIds.length > 0
      ? await Promise.all([
          prisma.teamRoleObservation.findMany({
            where: { aboutUserId: profile.id, teamId: { in: myTeamIds } },
            orderBy: { updatedAt: "asc" },
            select: { teamId: true, raterUserId: true, selections: true },
          }),
          prisma.teamMember.findMany({
            where: { teamId: { in: myTeamIds } },
            select: { teamId: true, userId: true },
          }),
        ])
      : [[], []];
  const membersByTeam = new Map<string, Set<string>>();
  for (const member of currentCoMembers) {
    const set = membersByTeam.get(member.teamId) ?? new Set<string>();
    set.add(member.userId);
    membersByTeam.set(member.teamId, set);
  }
  // A pool második argumentuma az aktuális-tag halmaz; a csapatonkénti
  // (szigorúbb) tagság-ellenőrzést az előszűrő adja, mert a pool egyetlen
  // halmazzal dolgozik (a csapat-fül hívásában ez egy csapat tagsága).
  const coMemberIds = new Set(currentCoMembers.map((m) => m.userId));
  const scopedObservationRows = teamRoleObservationsRaw
    .filter((obs) => membersByTeam.get(obs.teamId)?.has(obs.raterUserId))
    .map((obs) => ({
      aboutUserId: profile.id,
      raterUserId: obs.raterUserId,
      selections: obs.selections as TeamRoleSelections,
    }));
  const pooledPeerSelections = poolPeerSelectionsByRatedMember(
    scopedObservationRows,
    coMemberIds,
  );
  const peerAggregate = aggregatePeerRoleScores(
    pooledPeerSelections.get(profile.id) ?? [],
  );
  const teamRolePeer =
    peerAggregate.raterCount > 0
      ? {
          raterCount: peerAggregate.raterCount,
          scores: peerAggregate.scores as Record<string, number> | null,
          topRoles: peerAggregate.topRoles.map((r) => ({ role: r.role as string, score: r.score })),
        }
      : null;

  // W1 (privacy): a kitöltés időbélyege NAP-pontosságra vágva kerül a
  // kliensre — a másodperc-pontos completedAt az anonim értékelő
  // időzítés-alapú azonosítását segítené. A relationship mező (az értékelő
  // viszony-típusa) törölve a payloadból: semmi nem renderelte, feleslegesen
  // szivárgott volna a kliensre.
  const sentInvitations = sentInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    completedAt: inv.completedAt
      ? inv.completedAt.toISOString().slice(0, 10)
      : null,
    observerEmail: inv.observerEmail ?? null,
    observerName: inv.observerName ?? null,
    observerType: inv.observerType as string,
  }));

  const receivedInvitations = receivedInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    completedAt: inv.completedAt?.toISOString() ?? null,
    inviterUsername: inv.inviter?.username ?? null,
  }));

  // ── Active tab from searchParams ───────────────────────────────────────────
  const resolvedParams = await searchParams;
  const tabParam = resolvedParams?.tab;
  // Fül-dieta (UX-audit #22): 5 fül → 3. A régi linkek nem törnek:
  // workstyle → results (szekcióként ott él), invites → comparison
  // (a meghívó-kezelés a Külső kép fül része).
  // A karrier külön oldal lett — a régi `?tab=career` linkek (könyvjelző,
  // korábbi e-mail) ne fussanak zsákutcába.
  if (careerActive && tabParam === "career") redirect("/career");

  const initialTab: ProfileViewId =
    tabParam === "comparison" || tabParam === "invites"
      ? "comparison"
      : tabParam === "details" || tabParam === "results" || tabParam === "workstyle"
        ? "details"
        : "summary";
  const chapterParam = resolvedParams?.chapter;
  const initialDetailChapter: ReportChapterId =
    tabParam === "workstyle"
      ? "workstyle"
      : chapterParam === "dimensions" || chapterParam === "workstyle"
        ? chapterParam
        : "overview";

  // Az /assessment kész eredménnyel ide irányít (?retake=true) — a néma
  // redirect helyett explicit sáv magyarázza, mi történt, és innen
  // indítható az újratöltés (design-akciólista #12).
  const showRetakeBanner = resolvedParams?.retake === "true";

  const displayName =
    profile.username ?? profile.email ?? t("common.userFallback", locale);

  // Személyiség-típus címke a top-2 dimenzióból — a közös archetípus-
  // nyelvtannal (melléknév + főnév, pl. „Energikus újító"); a korábbi
  // mechanikus összefűzés („Innovátor Energikus") kivezetve.
  const personalityType =
    resolvePersonalityTypeFromScores(
      mainDimensions.map((d) => ({ code: d.code, score: d.score })),
      locale === "hu" ? "hu" : "en",
    ) ?? t("results.uniqueProfile", locale);

  // A páros összehasonlítás belépőkártyája az első összképben már a valódi
  // állapotot mutatja. Elfogadott kapcsolat előnyt élvez a függővel szemben:
  // ilyenkor a CTA közvetlenül a kész közös képet nyitja meg. A partner
  // pontszámai továbbra sem kerülnek a kliensre, csak a típus-glyph.
  const compareNow = new Date();
  const acceptedCompareInvite = rawCompareInvites.find(
    (invite) => resolveCompareInviteState(invite, compareNow) === "ACCEPTED",
  );
  const pendingCompareInvite = rawCompareInvites.find(
    (invite) => resolveCompareInviteState(invite, compareNow) === "PENDING",
  );

  let interactionEntry: InteractionEntryPreview = { state: "new" };
  if (acceptedCompareInvite) {
    const isInviter = acceptedCompareInvite.inviterId === profile.id;
    const otherId = isInviter
      ? acceptedCompareInvite.partnerId
      : acceptedCompareInvite.inviterId;
    const otherName = isInviter
      ? acceptedCompareInvite.partner?.username ?? null
      : acceptedCompareInvite.inviter.username ?? null;
    const otherResult = otherId
      ? await prisma.assessmentResult.findFirst({
          where: { userProfileId: otherId, isSelfAssessment: true },
          orderBy: { createdAt: "desc" },
          select: { scores: true },
        })
      : null;
    const otherDimensionScores = extractDimensionScores(otherResult?.scores);
    const otherDimensions = otherDimensionScores
      ? Object.entries(otherDimensionScores).map(([code, score]) => ({ code, score }))
      : [];
    const otherGlyph = resolveGlyphPair(otherDimensions);
    const otherLabel = resolvePersonalityTypeFromScores(otherDimensions, locale);

    interactionEntry = {
      state: "ready",
      otherName,
      pairId: acceptedCompareInvite.id,
      otherGlyph:
        otherGlyph && otherLabel
          ? { ...otherGlyph, label: otherLabel }
          : null,
    };
  } else if (pendingCompareInvite) {
    const isInviter = pendingCompareInvite.inviterId === profile.id;
    interactionEntry = {
      state: "pending",
      otherName: isInviter
        ? pendingCompareInvite.partner?.username ?? null
        : pendingCompareInvite.inviter.username ?? null,
    };
  }

  // Observer-folyamat állapota (self/csapat szétválasztás): org-tagnál a
  // meghívó-tab állapot-kártyát mutat, az összevetés küszöbhöz kötött.
  const observerFlow = await resolveObserverFlowStatus(profile.id);

  // Hero insight — behavior-based sentence (not dimension names).
  // A pár-választás közös szabályból (workstyle-content, motor-audit v6, M4c):
  // kanonikus rangsor (rankDimensionScores) + a fordított E kimarad a
  // „leggyengébb" slotból (az alacsony Emocionalitás stabilitás, nem
  // gyengeség) + lapos profilnál (terjedelem < HERO_RANGE_GATE_FACTOR·SEM,
  // indoklás a konstansnál) csak az erősség megy ki.
  const heroInsight = (() => {
    const pick = selectHeroInsightDims(mainDimensions, dimSem);
    if (!pick) return "";
    // Lapos profil (terjedelem-kapu, pick.flat): a „legerősebb" állítás is
    // zaj-műtermék lenne, miközben a strip csupa-közepest, a PDF pedig
    // „Kiegyensúlyozott profil"-t mond — a hero itt a kiegyensúlyozott-
    // profil mondatot kapja az erősség-ige helyett.
    if (pick.flat) return t("results.heroBalancedInsight", locale);
    const s =
      DIMENSION_STRENGTH_VERBS[pick.strongest.code]?.[locale] ?? pick.strongest.label;
    if (!pick.weakest) return `${s}.`;
    const w =
      DIMENSION_WEAK_VERBS[pick.weakest.code]?.[locale] ??
      pick.weakest.label.toLowerCase();
    return `${s} — ${w}.`;
  })();

  // A korábbi legacy strengths/watchAreas összefoglaló sorok kivezetve
  // (2026-08-11): a PDF-be mentek, de ott semmi nem renderelte őket — a
  // bullet-alapú változat (strengthBullets/watchBullets, ProfileTabs) él.

  // ── Plus content (profile engine narratives) ──────────────────────────────
  const lang = (locale === "en" ? "en" : "hu") as Locale;
  const dimScores = Object.fromEntries(mainDimensions.map((d) => [d.code, d.score]));
  const workstyle = buildWorkstyleContent(dimScores, testType, lang);

  const plusContent = accessLevel !== "start" ? {
    introText: BLOCK1[lang],
    howYouWorkParts: workstyle.howYouWorkParts,
    riskParts: workstyle.riskParts,
    pressure: workstyle.pressure,
    pressureParts: workstyle.pressureParts,
    growthTip: workstyle.growthTip,
    growthPlan: workstyle.growthPlan,
    collaboration: workstyle.collaboration,
    envItems: workstyle.envItems,
    roleFit: workstyle.roleFit,
    takeaways: workstyle.takeaways,
  } : undefined;

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-10 px-4 py-10 md:gap-14"
    >
      <DashboardAutoRefresh
        pendingInvites={pendingInvitesCount}
        completedObserver={completedObservers.length}
      />
      {/* A ProfileTabs belső ritmusával (gap-8 md:gap-12) azonos térköz a
          tabokon kívüli elemeknek (pl. csapat-érdeklődés banner) is. */}
      <div className="flex flex-col gap-8 md:gap-12">
        {showRetakeBanner && (
          <section className="flex flex-col gap-3 rounded-[18px] border border-sage/35 bg-sage/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {locale === "hu"
                  ? "A mérésed már készen van — ezt az eredményt látod itt."
                  : "Your assessment is already complete — this is that result."}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-body">
                {locale === "hu"
                  ? "Ha újra kitöltöd, a mostani profilod frissül az új válaszaid alapján."
                  : "If you retake it, your profile will be updated based on your new answers."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/assessment?confirmed=true"
                className={getButtonClassName({ variant: "primary", size: "sm" })}
              >
                {locale === "hu" ? "Újratöltés indítása" : "Start retake"}
              </Link>
              <Link
                href="/profile/results"
                className={getButtonClassName({ variant: "ghost", size: "sm" })}
              >
                {locale === "hu" ? "Maradok az eredményeknél" : "Keep my results"}
              </Link>
            </div>
          </section>
        )}
        <ProfileTabs
          name={displayName}
          assessmentDate={latestResult.createdAt.toISOString()}
          accessLevel={accessLevel}
          initialTab={initialTab}
          initialDetailChapter={initialDetailChapter}
          dimensions={dimensions}
          growthFocusItems={growthFocusItems}
          hasObserverData={hasObserverData}
          observerCount={completedObservers.length}
          avgObserverConfidence={avgObserverConfidence}
          selfFacetScores={selfFacetScores}
          observerFacetAverages={hasObserverData ? observerFacetAverages : null}
          facetSem={facetSemRounded}
          observerFlow={observerFlow}
          sentInvitations={sentInvitations}
          receivedInvitations={receivedInvitations}
          feedbackSubmitted={feedbackSubmitted}
          clarityFeedbackSubmitted={clarityFeedbackSubmitted}
          personalityType={personalityType}
          heroInsight={heroInsight}
          shareToken={publicSharingActive ? latestResult.shareToken : null}
          hasActiveShare={activeShareCount > 0}
          plusContent={plusContent}
          careerResult={careerResult}
          careerModuleHidden={!careerActive || Boolean(careerHiddenMembership)}
          bridgeNextStep={{
            stage: selfDashboardVm.journeyStage ?? journeySnapshot.state.currentStage,
            explanation: selfDashboardVm.recommendedAction.description,
            primary: {
              label: selfDashboardVm.recommendedAction.primary.label,
              href: selfDashboardVm.recommendedAction.primary.href,
            },
            secondary: selfDashboardVm.recommendedAction.secondary
              ? {
                  label: selfDashboardVm.recommendedAction.secondary.label,
                  href: selfDashboardVm.recommendedAction.secondary.href,
                }
              : null,
          }}
          teamRoleMeasuredScores={teamRoleMeasuredScores}
          teamRolePeer={teamRolePeer}
          experienceHints={journeySnapshot.resolution.experienceHints}
          experienceHintDestination={journeySnapshot.resolution.destination}
          interactionEntry={interactionEntry}
        />

        {/* Csapat-érdeklődés (meleg lead) — csak consulting-led módban,
            és csak ha a user még nem tagja csapatnak/szervezetnek. */}
        {isConsultingLed() &&
          !journeySnapshot.state.completionSummary.team.joined &&
          !journeySnapshot.state.completionSummary.org.joined && (
            <TeamInterestBanner
              alreadySent={Boolean(
                await prisma.feedback.findUnique({
                  where: {
                    userProfileId_kind_targetKey: {
                      userProfileId: profile.id,
                      kind: "feature_interest",
                      targetKey: "team",
                    },
                  },
                  select: { id: true },
                }),
              )}
            />
          )}

      </div>
    </PlatformPageShell>
  );
}
