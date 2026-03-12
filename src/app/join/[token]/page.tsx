import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { JoinClient } from "./JoinClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Csatlakozás a csapathoz | trita",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // token === TeamPendingInvite.id (cuid)
  const invite = await prisma.teamPendingInvite.findUnique({
    where: { id: token },
    select: {
      id: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          orgId: true,
          org: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!invite || !invite.team.orgId) notFound();

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect(`/sign-up?redirect_url=/join/${token}`);
  }

  // Ensure profile exists (Clerk webhook may lag)
  let profile = await prisma.userProfile.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true, onboardedAt: true },
  });

  if (!profile) {
    const created = await prisma.userProfile.upsert({
      where: { clerkId: clerkUser.id },
      create: { clerkId: clerkUser.id },
      update: {},
      select: { id: true, onboardedAt: true },
    });
    profile = created;
  }

  if (!profile) notFound();

  // Already in an org → send to dashboard
  const existingOrgMembership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
  });
  if (existingOrgMembership) {
    redirect("/dashboard");
  }

  return (
    <JoinClient
      inviteId={invite.id}
      teamId={invite.teamId}
      teamName={invite.team.name}
      orgName={invite.team.org?.name ?? ""}
    />
  );
}
