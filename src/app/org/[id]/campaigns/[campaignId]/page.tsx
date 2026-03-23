import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { CampaignStatusButton } from "@/components/org/CampaignStatusButton";
import { AddParticipantButton } from "@/components/org/AddParticipantButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Kampány | Trita", robots: { index: false } };
}

const STATUS_TRANSITIONS: Record<string, string | null> = {
  DRAFT: "ACTIVE",
  ACTIVE: "CLOSED",
  CLOSED: null,
};

const HEXACO_DIMS = ["H", "E", "X", "A", "C", "O"] as const;

const HEXACO_COLORS: Record<string, string> = {
  H: "#6366F1",
  E: "#8B5CF6",
  X: "#06B6D4",
  A: "#10B981",
  C: "#F59E0B",
  O: "#EF4444",
};

const HEXACO_LABELS_HU: Record<string, string> = {
  H: "Önzetlenség",
  E: "Érzelmi stabilitás",
  X: "Extraverzió",
  A: "Barátságosság",
  C: "Lelkiismeretesség",
  O: "Nyitottság",
};

const HEXACO_LABELS_EN: Record<string, string> = {
  H: "Honesty-Humility",
  E: "Emotionality",
  X: "eXtraversion",
  A: "Agreeableness",
  C: "Conscientiousness",
  O: "Openness",
};

function statusLabel(status: string, isHu: boolean) {
  if (status === "ACTIVE") return isHu ? "Aktív" : "Active";
  if (status === "CLOSED") return isHu ? "Lezárva" : "Closed";
  return isHu ? "Vázlat" : "Draft";
}

function statusBadgeClass(status: string) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "CLOSED") return "bg-sand text-ink-body";
  return "bg-amber-50 text-amber-700";
}

function nextStatusLabel(status: string, isHu: boolean) {
  if (status === "ACTIVE") return isHu ? "Kampány aktiválása" : "Activate campaign";
  if (status === "CLOSED") return isHu ? "Kampány lezárása" : "Close campaign";
  return "";
}

function eyebrowLabel(status: string, isHu: boolean) {
  if (status === "ACTIVE") return isHu ? "// aktív kampány" : "// active campaign";
  if (status === "CLOSED") return isHu ? "// lezárt kampány" : "// closed campaign";
  return isHu ? "// kampány – tervezés alatt" : "// campaign – draft";
}

function computeAvgScores(
  results: { userProfileId: string | null; scores: unknown }[]
): Record<string, number> | null {
  const sums: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0 };
  let count = 0;
  for (const r of results) {
    const scores = r.scores as Record<string, number>;
    const hasAll = HEXACO_DIMS.every((d) => typeof scores[d] === "number");
    if (hasAll) {
      for (const d of HEXACO_DIMS) {
        sums[d] += scores[d];
      }
      count++;
    }
  }
  if (count === 0) return null;
  const avg: Record<string, number> = {};
  for (const d of HEXACO_DIMS) {
    avg[d] = Math.round(sums[d] / count);
  }
  return avg;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string; campaignId: string }>;
}) {
  const [locale, { id: orgId, campaignId }] = await Promise.all([
    getServerLocale(),
    params,
  ]);

  const { role: memberRole } = await requireOrgContext(orgId);
  await requireActiveSubscription();

  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  const [campaign, orgMembers] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId, orgId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        closedAt: true,
        creator: { select: { username: true } },
        participants: {
          orderBy: { addedAt: "asc" },
          select: {
            id: true,
            addedAt: true,
            userId: true,
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
    }),
    prisma.organizationMember.findMany({
      where: { orgId },
      select: {
        userId: true,
        user: { select: { username: true, email: true } },
      },
    }),
  ]);

  if (!campaign) notFound();

  const participantUserIds = campaign.participants.map((p) => p.userId);

  // Self-assessment completion
  const selfDoneResults = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: participantUserIds },
      isSelfAssessment: true,
    },
    select: { userProfileId: true, scores: true },
    distinct: ["userProfileId"],
  });
  const selfDoneSet = new Set(
    selfDoneResults.map((r) => r.userProfileId).filter(Boolean) as string[]
  );

  // Observer completion
  const observerResults = await prisma.observerInvitation.findMany({
    where: {
      inviterId: { in: participantUserIds },
      status: "COMPLETED",
    },
    select: { inviterId: true },
  });
  const observerCountMap = new Map<string, number>();
  for (const inv of observerResults) {
    observerCountMap.set(inv.inviterId, (observerCountMap.get(inv.inviterId) ?? 0) + 1);
  }

  // Derived stats
  const selfDoneCount = participantUserIds.filter((id) => selfDoneSet.has(id)).length;
  const observerDoneCount = participantUserIds.filter(
    (id) => (observerCountMap.get(id) ?? 0) > 0
  ).length;
  const fullyDoneCount = participantUserIds.filter(
    (id) => selfDoneSet.has(id) && (observerCountMap.get(id) ?? 0) > 0
  ).length;
  const totalCount = participantUserIds.length;

  const completionPct =
    totalCount > 0 ? Math.round((selfDoneCount / totalCount) * 100) : 0;

  // For CLOSED: compute HEXACO averages + previous campaign comparison
  let currentAvgScores: Record<string, number> | null = null;
  let previousAvgScores: Record<string, number> | null = null;
  let previousCampaignName: string | null = null;

  if (campaign.status === "CLOSED" && selfDoneResults.length > 0) {
    currentAvgScores = computeAvgScores(selfDoneResults);

    // Find the previous CLOSED campaign (before this one)
    const prevCampaign = await prisma.campaign.findFirst({
      where: {
        orgId,
        status: "CLOSED",
        id: { not: campaignId },
        closedAt: { lt: campaign.closedAt ?? new Date() },
      },
      orderBy: { closedAt: "desc" },
      select: {
        id: true,
        name: true,
        participants: {
          select: { userId: true },
        },
      },
    });

    if (prevCampaign) {
      const prevParticipantIds = prevCampaign.participants.map((p) => p.userId);
      if (prevParticipantIds.length > 0) {
        const prevResults = await prisma.assessmentResult.findMany({
          where: {
            userProfileId: { in: prevParticipantIds },
            isSelfAssessment: true,
          },
          select: { userProfileId: true, scores: true },
          distinct: ["userProfileId"],
        });
        previousAvgScores = computeAvgScores(prevResults);
        previousCampaignName = prevCampaign.name;
      }
    }
  }

  const nextStatus = STATUS_TRANSITIONS[campaign.status] ?? null;

  // Available members not yet in campaign
  const addedUserIds = new Set(campaign.participants.map((p) => p.user.id));
  const availableMembers = orgMembers
    .filter((m) => !addedUserIds.has(m.userId))
    .map((m) => ({
      userId: m.userId,
      username: m.user.username ?? null,
      email: m.user.email ?? null,
    }));

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10">

        {/* Back link */}
        <Link
          href={`/org/${orgId}?tab=campaigns`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-bronze"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? "Vissza a szervezethez" : "Back to organization"}
        </Link>

        {/* Header */}
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">
            {eyebrowLabel(campaign.status, isHu)}
          </p>
          <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="mt-1 text-sm text-ink-body">{campaign.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(campaign.status)}`}
            >
              {statusLabel(campaign.status, isHu)}
            </span>
            <span className="text-xs text-ink-body/50">
              {isHu ? "Létrehozva:" : "Created:"}{" "}
              {campaign.createdAt.toLocaleDateString(dateLocale)}
            </span>
            {campaign.closedAt && (
              <span className="text-xs text-ink-body/50">
                {isHu ? "Lezárva:" : "Closed:"}{" "}
                {campaign.closedAt.toLocaleDateString(dateLocale)}
              </span>
            )}
            <span className="text-xs text-ink-body/50">
              {totalCount}{" "}
              {isHu
                ? "résztvevő"
                : totalCount === 1
                  ? "participant"
                  : "participants"}
            </span>
            {totalCount > 0 && (
              <span className="text-xs text-ink-body/50">
                {completionPct}% {isHu ? "kitöltve" : "complete"}
              </span>
            )}
          </div>
        </div>

        {/* Summary stat cards */}
        {totalCount > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Self-assessment */}
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ backgroundColor: "var(--color-sage)" }}
              />
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-muted)" }}
              >
                {isHu ? "Önértékelés" : "Self-assessment"}
              </p>
              <p className="mt-1 font-fraunces text-3xl text-ink">
                {selfDoneCount}
                <span className="ml-1 font-sans text-sm font-normal text-muted">
                  / {totalCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-body">
                {Math.round((selfDoneCount / totalCount) * 100)}%{" "}
                {isHu ? "befejezett" : "completed"}
              </p>
            </div>

            {/* Observer */}
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ backgroundColor: "#059669" }}
              />
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-muted)" }}
              >
                {isHu ? "Observer kész" : "Observer done"}
              </p>
              <p className="mt-1 font-fraunces text-3xl text-ink">
                {observerDoneCount}
                <span className="ml-1 font-sans text-sm font-normal text-muted">
                  / {totalCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-body">
                {Math.round((observerDoneCount / totalCount) * 100)}%{" "}
                {isHu ? "kapott visszajelzést" : "received feedback"}
              </p>
            </div>

            {/* Fully done */}
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ backgroundColor: "#6366F1" }}
              />
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-muted)" }}
              >
                {isHu ? "Teljes befejezés" : "Fully complete"}
              </p>
              <p className="mt-1 font-fraunces text-3xl text-ink">
                {fullyDoneCount}
                <span className="ml-1 font-sans text-sm font-normal text-muted">
                  / {totalCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-body">
                {Math.round((fullyDoneCount / totalCount) * 100)}%{" "}
                {isHu ? "mindkettő kész" : "both done"}
              </p>
            </div>
          </div>
        )}

        {/* Development arc (closed campaigns with previous data) */}
        {campaign.status === "CLOSED" &&
          currentAvgScores &&
          previousAvgScores &&
          previousCampaignName && (
            <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                {isHu ? "// fejlődési ív" : "// development arc"}
              </p>
              <h2 className="mb-1 font-fraunces text-xl text-ink">
                {isHu ? "Fejlődési ív" : "Development arc"}
              </h2>
              <p className="mb-5 text-xs text-ink-body">
                {isHu
                  ? `Összehasonlítás: "${previousCampaignName}" kampányhoz képest`
                  : `Compared to: "${previousCampaignName}" campaign`}
              </p>
              <div className="flex flex-col gap-3">
                {HEXACO_DIMS.map((d) => {
                  const curr = currentAvgScores![d] ?? 0;
                  const prev = previousAvgScores![d] ?? 0;
                  const delta = curr - prev;
                  const label = isHu ? HEXACO_LABELS_HU[d] : HEXACO_LABELS_EN[d];
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-xs text-ink-body truncate">
                        {label}
                      </span>
                      <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-sand">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${curr}%`,
                            backgroundColor: HEXACO_COLORS[d],
                          }}
                        />
                      </div>
                      <span
                        className={`w-14 text-right text-xs tabular-nums font-semibold ${
                          delta > 0
                            ? "text-emerald-600"
                            : delta < 0
                              ? "text-rose-600"
                              : "text-muted"
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                      </span>
                      <span className="w-8 text-right text-xs tabular-nums text-muted">
                        {curr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        {/* Participants */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {isHu ? "// résztvevők" : "// participants"}
          </p>
          <h2 className="mb-5 font-fraunces text-xl text-ink">
            {isHu ? "Résztvevők" : "Participants"}{" "}
            <span className="font-sans text-sm font-normal text-ink-body/50">
              ({totalCount})
            </span>
          </h2>

          {totalCount === 0 ? (
            <p className="py-6 text-center text-sm text-ink-body/50">
              {isHu ? "Még nincs résztvevő." : "No participants yet."}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-sand">
              {campaign.participants.map((p) => {
                const isSelfDone = selfDoneSet.has(p.userId);
                const obsCount = observerCountMap.get(p.userId) ?? 0;
                const isFullyDone = isSelfDone && obsCount > 0;

                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {p.user.username ?? p.user.email ?? "—"}
                      </p>
                      {p.user.username && (
                        <p className="truncate text-xs text-ink-body/60">{p.user.email}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isFullyDone ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {isHu ? "Kész" : "Done"}
                        </span>
                      ) : isSelfDone ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {isHu ? "Önért. kész" : "Self done"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-ink-body">
                          {isHu ? "Nem kezdte" : "Not started"}
                        </span>
                      )}
                      {obsCount > 0 && (
                        <span className="text-xs text-muted">
                          {obsCount} obs.
                        </span>
                      )}
                      <span className="text-xs text-ink-body/50">
                        {p.addedAt.toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isManager && campaign.status !== "CLOSED" && availableMembers.length > 0 && (
            <div className="mt-5 border-t border-sand pt-5">
              <AddParticipantButton
                orgId={orgId}
                campaignId={campaign.id}
                members={availableMembers}
                isHu={isHu}
              />
            </div>
          )}
        </section>

        {/* Status transition */}
        {isManager && nextStatus && (
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              {isHu ? "// státusz" : "// status"}
            </p>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              {isHu ? "Kampány kezelése" : "Campaign management"}
            </h2>
            <p className="mb-4 text-xs text-ink-body/60">
              {campaign.status === "DRAFT"
                ? isHu
                  ? "Az aktiválás után a résztvevők értesítést kapnak és megkezdhetik az értékeléseket."
                  : "After activation, participants will be notified and can begin evaluations."
                : isHu
                  ? "A lezárás végleges — az értékelések leállnak és az eredmények rögzülnek."
                  : "Closing is permanent — evaluations stop and results are recorded."}
            </p>
            <CampaignStatusButton
              orgId={orgId}
              campaignId={campaign.id}
              nextStatus={nextStatus}
              label={nextStatusLabel(nextStatus, isHu)}
              isDanger={nextStatus === "CLOSED"}
            />
          </section>
        )}

      </main>
    </div>
  );
}
