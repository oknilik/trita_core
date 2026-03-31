import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveMembershipInviteResolution,
} from "@/lib/membership-onboarding/server";
import { getServerLocale } from "@/lib/i18n-server";
import { JoinOrgClient } from "./JoinOrgClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Csatlakozás a szervezethez | trita" : "Join organization | trita",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function JoinOrgPage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;

  const clerkUser = await currentUser();
  const resolution = await resolveMembershipInviteResolution({
    kind: "org",
    inviteId,
    clerkId: clerkUser?.id ?? null,
  });

  if (resolution.inviteState === "INVITE_NOT_FOUND" || !resolution.invite) notFound();
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    redirect(resolution.signUpRedirectUrl ?? `/sign-up?redirect_url=/join/org/${inviteId}`);
  }
  if (resolution.redirectTo) {
    redirect(resolution.redirectTo);
  }
  if (!resolution.actor || resolution.invite.kind !== "org") notFound();
  if (
    resolution.inviteState !== "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE" &&
    resolution.inviteState !== "INVITED_READY_TO_JOIN"
  ) {
    notFound();
  }

  return (
    <JoinOrgClient
      inviteState={resolution.inviteState}
      inviteId={resolution.invite.inviteId}
      orgName={resolution.invite.orgName}
      existingProfile={
        resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
          ? null
          : { username: resolution.actor.username }
      }
    />
  );
}
