import { notFound, redirect } from "next/navigation";
import { getServerAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { buildSignInPath } from "@/lib/navigation/auth-redirects";
import { normalizeLocale } from "@/lib/i18n/core";
import { FOLLOWUP_COPY } from "@/lib/lifecycle/copy";
import { isPersonalRule } from "@/lib/lifecycle/rules";
import { syncOpportunity } from "@/lib/lifecycle/service";
import { FollowupActions } from "@/components/lifecycle/FollowupActions";

export default async function FollowupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await getServerAuth();
  if (!userId) redirect(buildSignInPath(`/profile/follow-up/${encodeURIComponent(id)}`));
  const profile = await prisma.userProfile.findUnique({ where: { clerkId: userId }, select: { id: true, locale: true, deleted: true } });
  if (!profile || profile.deleted) notFound();
  await syncOpportunity(profile.id);
  const goal = await prisma.lifecycleOpportunity.findFirst({ where: { id, profileId: profile.id } });
  if (!goal || !isPersonalRule(goal.rule)) notFound();
  const locale = normalizeLocale(profile.locale);
  const copy = FOLLOWUP_COPY[goal.rule][locale];
  return <main className="mx-auto min-h-[60vh] max-w-2xl px-5 py-16">
    <h1 className="font-fraunces text-title text-ink">{copy.title}</h1>
    <p className="mt-4 leading-relaxed text-ink-body">{goal.status === "OPEN" ? copy.body : locale === "hu" ? "Ez az emlékeztető már lezárult. Az aktuális következő lépésedet továbbra is megnyithatod." : "This reminder has closed. You can still open your current next step."}</p>
    <a href={`/api/lifecycle/continue?id=${encodeURIComponent(id)}`} className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 py-3 font-semibold text-[var(--color-action-primary-fg)]">{goal.status === "OPEN" ? copy.cta : locale === "hu" ? "Tovább a profilomhoz" : "Continue to my profile"}</a>
    {goal.status === "OPEN" && <FollowupActions id={id} locale={locale} />}
    <a href="/email-preferences" className="mt-6 block text-sm underline">{locale === "hu" ? "Email-beállítások" : "Email preferences"}</a>
  </main>;
}
