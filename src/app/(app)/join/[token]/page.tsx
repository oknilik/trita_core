import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveTeamJoinPageModel,
} from "@/lib/acceptance/service";
import { getServerLocale } from "@/lib/i18n-server";
import { getServerAuth } from "@/lib/auth-server";
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

  const { userId } = await getServerAuth();
  const model = await resolveTeamJoinPageModel({
    inviteId: token,
    clerkId: userId,
  });

  if (model.state === "invalid_token") notFound();
  if (model.state === "auth_required") redirect(model.redirectTo);
  if (model.state === "already_accepted") redirect(model.redirectTo);
  if (model.state === "policy_restricted") redirect(model.redirectTo);

  const { payload } = model;
  return (
    <JoinClient
      acceptanceState={payload.acceptanceState}
      inviteId={payload.inviteId}
      teamName={payload.teamName}
      orgName={payload.orgName}
      alreadyInTargetOrg={payload.alreadyInTargetOrg}
      existingProfile={payload.existingProfile}
      existingOrg={payload.existingOrg}
    />
  );
}
