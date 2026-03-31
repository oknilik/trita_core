import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveMembershipJoinPageAccess,
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
  const access = await resolveMembershipJoinPageAccess({
    kind: "org",
    inviteId,
    clerkId: clerkUser?.id ?? null,
    allowedStates: [
      "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE",
      "INVITED_READY_TO_JOIN",
    ],
  });

  if (access.type === "not_found") notFound();
  if (access.type === "redirect") redirect(access.href);

  const { resolution } = access;
  if (resolution.invite.kind !== "org") notFound();

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
