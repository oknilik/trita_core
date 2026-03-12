import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { JoinOrgClient } from "./JoinOrgClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Csatlakozás a szervezethez | trita",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function JoinOrgPage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;

  const invite = await prisma.organizationPendingInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      orgId: true,
      org: { select: { id: true, name: true } },
    },
  });

  if (!invite) notFound();

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect(`/sign-up?redirect_url=/join/org/${inviteId}`);
  }

  // Ensure profile exists (Clerk webhook may lag)
  let profile = await prisma.userProfile.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });

  if (!profile) {
    profile = await prisma.userProfile.upsert({
      where: { clerkId: clerkUser.id },
      create: { clerkId: clerkUser.id },
      update: {},
      select: { id: true },
    });
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
    <JoinOrgClient
      inviteId={invite.id}
      orgName={invite.org.name}
    />
  );
}
