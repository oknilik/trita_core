import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveOrgJoinPageModel,
} from "@/lib/acceptance/service";
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
  const model = await resolveOrgJoinPageModel({
    inviteId,
    clerkId: clerkUser?.id ?? null,
  });

  if (model.state === "invalid_token") notFound();
  if (model.state === "auth_required") redirect(model.redirectTo);
  if (model.state === "already_accepted") redirect(model.redirectTo);
  if (model.state === "policy_restricted") redirect(model.redirectTo);

  const { payload } = model;
  return (
    <JoinOrgClient
      acceptanceState={payload.acceptanceState}
      inviteId={payload.inviteId}
      orgName={payload.orgName}
      existingProfile={payload.existingProfile}
    />
  );
}
