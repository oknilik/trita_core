import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { CampaignStatusButton } from "@/components/org/CampaignStatusButton";
import { AddParticipantButton } from "@/components/org/AddParticipantButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Kampány | Trita", robots: { index: false } };
}

const STATUS_TRANSITIONS: Record<string, string | null> = {
  DRAFT: "ACTIVE",
  ACTIVE: "CLOSED",
  CLOSED: null,
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string; campaignId: string }>;
}) {
  const [locale, { id: orgId, campaignId }] = await Promise.all([
    getServerLocale(),
    params,
  ]);

  const { role: memberRole } = await requireOrgContext(orgId);
  await requireActiveSubscription();
  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isHu = locale !== "en";

  const [campaign, orgMembers] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId, orgId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        closedAt: true,
        creator: { select: { username: true } },
        participants: {
          orderBy: { addedAt: "asc" },
          select: {
            id: true,
            addedAt: true,
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
    }),
    prisma.organizationMember.findMany({
      where: { orgId },
      select: {
        userId: true,
        user: { select: { username: true, email: true } },
      },
    }),
  ]);

  if (!campaign) notFound();

  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";
  const nextStatus = STATUS_TRANSITIONS[campaign.status] ?? null;

  function statusLabel(status: string) {
    if (status === "ACTIVE") return isHu ? "Aktív" : "Active";
    if (status === "CLOSED") return isHu ? "Lezárva" : "Closed";
    return isHu ? "Vázlat" : "Draft";
  }

  function statusBadgeClass(status: string) {
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
    if (status === "CLOSED") return "bg-[#e8e4dc] text-[#3d3a35]";
    return "bg-amber-50 text-amber-700";
  }

  function nextStatusLabel(status: string) {
    if (status === "ACTIVE") return isHu ? "Kampány aktiválása" : "Activate campaign";
    if (status === "CLOSED") return isHu ? "Kampány lezárása" : "Close campaign";
    return "";
  }

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:gap-12">

        {/* Header */}
        <div>
          <Link
            href={`/org/${orgId}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] transition-colors hover:text-[#c8410a]"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isHu ? "Vissza a szervezethez" : "Back to organization"}
          </Link>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
              {isHu ? "// 360° kampány" : "// 360° campaign"}
            </p>
            <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] md:text-4xl">
              {campaign.name}
            </h1>
            {campaign.description && (
              <p className="mt-1 text-sm text-[#3d3a35]/70">{campaign.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(campaign.status)}`}>
                {statusLabel(campaign.status)}
              </span>
              <span className="text-xs text-[#3d3a35]/50">
                {campaign.participants.length}{" "}
                {isHu ? "résztvevő" : campaign.participants.length === 1 ? "participant" : "participants"}
              </span>
              {campaign.closedAt && (
                <span className="text-xs text-[#3d3a35]/50">
                  {isHu ? "Lezárva:" : "Closed:"}{" "}
                  {campaign.closedAt.toLocaleDateString(dateLocale)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// résztvevők" : "// participants"}
          </p>
          <h2 className="mb-5 font-playfair text-xl text-[#1a1814]">
            {isHu ? "Résztvevők" : "Participants"}{" "}
            <span className="font-sans text-sm font-normal text-[#3d3a35]/50">
              ({campaign.participants.length})
            </span>
          </h2>

          {campaign.participants.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#3d3a35]/50">
              {isHu ? "Még nincs résztvevő." : "No participants yet."}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[#e8e4dc]">
              {campaign.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1a1814]">
                      {p.user.username ?? p.user.email ?? "—"}
                    </p>
                    {p.user.username && (
                      <p className="truncate text-xs text-[#3d3a35]/60">{p.user.email}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#3d3a35]/50">
                    {p.addedAt.toLocaleDateString(dateLocale)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isManager && campaign.status !== "CLOSED" && (() => {
            const addedUserIds = new Set(campaign.participants.map((p) => p.user.id));
            const availableMembers = orgMembers
              .filter((m) => !addedUserIds.has(m.userId))
              .map((m) => ({
                userId: m.userId,
                username: m.user.username ?? null,
                email: m.user.email ?? null,
              }));
            return availableMembers.length > 0 ? (
              <div className="mt-5 border-t border-[#e8e4dc] pt-5">
                <AddParticipantButton
                  orgId={orgId}
                  campaignId={campaign.id}
                  members={availableMembers}
                  isHu={isHu}
                />
              </div>
            ) : null;
          })()}
        </section>

        {/* Status transition (manager only) */}
        {isManager && nextStatus && (
          <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
              {isHu ? "// státusz" : "// status"}
            </p>
            <h2 className="mb-3 text-sm font-semibold text-[#1a1814]">
              {isHu ? "Kampány kezelése" : "Campaign management"}
            </h2>
            <p className="mb-4 text-xs text-[#3d3a35]/60">
              {campaign.status === "DRAFT"
                ? isHu
                  ? "Az aktiválás után a résztvevők értesítést kapnak és megkezdhetik az értékeléseket."
                  : "After activation, participants will be notified and can begin evaluations."
                : isHu
                  ? "A lezárás végleges — az értékelések leállnak és az eredmények rögzülnek."
                  : "Closing is permanent — evaluations stop and results are recorded."}
            </p>
            <CampaignStatusButton
              orgId={orgId}
              campaignId={campaign.id}
              nextStatus={nextStatus}
              label={nextStatusLabel(nextStatus)}
              isDanger={nextStatus === "CLOSED"}
            />
          </section>
        )}

      </main>
    </div>
  );
}
