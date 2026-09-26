import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { buildSignInPath } from "@/lib/navigation/auth-redirects";
import { resolveJourney } from "@/lib/journey/engine";
import { loadLifecycleContext } from "@/lib/lifecycle/context";
import { selectGoal } from "@/lib/lifecycle/rules";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.slice(0, 191) ?? "";
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.redirect(new URL(buildSignInPath(`/api/lifecycle/continue?id=${encodeURIComponent(id)}`), req.url));
  const profile = await prisma.userProfile.findUnique({ where: { clerkId: userId }, select: { id: true, deleted: true } });
  if (!profile || profile.deleted) return NextResponse.redirect(new URL("/onboarding", req.url));
  const opportunity = await prisma.lifecycleOpportunity.findFirst({ where: { id, profileId: profile.id } });
  const [context, journey] = await Promise.all([loadLifecycleContext(profile.id), resolveJourney(profile.id)]);
  const goal = context ? selectGoal(context) : null;
  const requestedAction = opportunity && goal?.rule === opportunity.rule && goal.goalKey === opportunity.goalKey
    ? journey.state.availableNextActions.find(a => a.id === goal.action) : null;
  return NextResponse.redirect(new URL(requestedAction?.href ?? journey.destination, req.url));
}
