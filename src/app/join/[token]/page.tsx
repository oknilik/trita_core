import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveTeamJoinPageModel,
} from "@/lib/acceptance/service";
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
  const model = await resolveTeamJoinPageModel({
    inviteId: token,
    clerkId: clerkUser?.id ?? null,
  });

  if (model.view === "not_found") notFound();
  if (model.view === "redirect") redirect(model.href);

  const { payload } = model;
  return (
    <JoinClient
      inviteState={payload.inviteState}
      inviteId={payload.inviteId}
      teamName={payload.teamName}
      orgName={payload.orgName}
      alreadyInTargetOrg={payload.alreadyInTargetOrg}
      existingProfile={payload.existingProfile}
      existingOrg={payload.existingOrg}
    />
  );
}
