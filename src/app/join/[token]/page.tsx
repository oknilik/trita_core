import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveMembershipInviteResolution,
} from "@/lib/membership-onboarding/server";
import { getServerLocale } from "@/lib/i18n-server";
import { JoinClient } from "./JoinClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Csatlakozás a csapathoz | trita" : "Join team | trita",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const clerkUser = await currentUser();
  const resolution = await resolveMembershipInviteResolution({
    kind: "team",
    inviteId: token,
    clerkId: clerkUser?.id ?? null,
  });

  if (resolution.inviteState === "INVITE_NOT_FOUND" || !resolution.invite) notFound();
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    redirect(resolution.signUpRedirectUrl ?? `/sign-up?redirect_url=/join/${token}`);
  }
  if (resolution.redirectTo) {
    redirect(resolution.redirectTo);
  }
  if (!resolution.actor || resolution.invite.kind !== "team") notFound();
  if (
    resolution.inviteState !== "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE" &&
    resolution.inviteState !== "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED" &&
    resolution.inviteState !== "INVITED_READY_TO_JOIN"
  ) {
    notFound();
  }

  const existingOrg =
    resolution.inviteState === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED"
      ? resolution.actor.activeOrgMembership
      : null;
  const alreadyInTargetOrg = resolution.actor.activeOrgMembership?.orgId === resolution.invite.orgId;
  const existingProfile =
    resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
      ? null
      : { username: resolution.actor.username };

  return (
    <JoinClient
      inviteState={resolution.inviteState}
      inviteId={resolution.invite.inviteId}
      teamName={resolution.invite.teamName}
      orgName={resolution.invite.orgName}
      alreadyInTargetOrg={Boolean(alreadyInTargetOrg)}
      existingProfile={existingProfile}
      existingOrg={existingOrg}
    />
  );
}
