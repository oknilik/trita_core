import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";
import { AnswerSchema } from "@/lib/team-operating-style/scoring";
import { OperatingStyleClient } from "./OperatingStyleClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Csapatműködés | trita", robots: { index: false } };
export default async function OperatingStylePage({ searchParams }: { searchParams: Promise<{ campaignId?: string }> }) {
  const [locale, { userId }, query] = await Promise.all([getServerLocale(), auth(), searchParams]);
  if (!userId) return redirectToSignIn();
  const profile = await prisma.userProfile.findUnique({ where: { clerkId: userId }, select: { id: true, deleted: true } });
  if (!profile || profile.deleted) return redirectToSignIn();
  await releaseDueCampaignSteps({ userId: profile.id }).catch(() => {});
  const candidates = await prisma.campaignParticipant.findMany({
    where: { userId: profile.id, campaign: { status: "ACTIVE", ...(query.campaignId ? { id: query.campaignId } : {}),
      org: { members: { some: { userId: profile.id, leftAt: null } } },
      operatingRound: { is: { eligibleUserIds: { has: profile.id }, team: { members: { some: { userId: profile.id } } } } },
    } },
    include: { campaign: { include: { operatingRound: { include: { team: { select: { name: true } },
      responses: { where: { userId: profile.id } } } } } } },
    orderBy: { addedAt: "asc" },
  });
  const available = candidates.filter((p) => isStepOpenFor(p.campaign, p, "TEAM_OPERATING_STYLE"));
  if (available.length !== 1) return <main className="mx-auto max-w-3xl space-y-5 p-6">
    <h1 className="font-fraunces text-title">{t(available.length ? "tos.choose" : "tos.none", locale)}</h1>
    {available.map((p) => <Link key={p.id} className="block min-h-[44px] rounded-xl border border-sand p-4" href={`/assessment/team-operating-style?campaignId=${encodeURIComponent(p.campaignId)}`}>{p.campaign.name} · {p.campaign.operatingRound?.team.name}</Link>)}
    <Link href="/dashboard">{t("tos.back", locale)}</Link>
  </main>;
  const campaign = available[0].campaign;
  const round = campaign.operatingRound!;
  const parsed = AnswerSchema.safeParse(round.responses[0]?.answers ?? {});
  return <main className="min-h-dvh bg-cream"><OperatingStyleClient locale={locale} campaignId={campaign.id}
    campaignName={campaign.name} teamName={round.team.name} initialAnswers={parsed.success ? parsed.data : {}}
    referenceStart={round.referenceStart.toISOString()} referenceEnd={round.referenceEnd.toISOString()} /></main>;
}
