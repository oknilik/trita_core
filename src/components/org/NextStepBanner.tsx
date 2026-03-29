"use client";

import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface NextStepBannerProps {
  orgId: string;
  memberCount: number;
  activeCampaignCount: number;
  completedMemberCount: number;
  hexacoAvg: Record<string, number> | null;
  isHu: boolean;
}

type StepState =
  | "invite_members"
  | "create_campaign"
  | "await_completions"
  | "ready";

function getStepState(props: NextStepBannerProps): StepState {
  const { memberCount, activeCampaignCount, completedMemberCount, hexacoAvg } = props;
  if (memberCount < 3) return "invite_members";
  if (activeCampaignCount === 0 && !hexacoAvg) return "create_campaign";
  if (completedMemberCount < 3) return "await_completions";
  return "ready";
}

const STEP_CONFIG: Record<
  StepState,
  {
    icon: string;
    bgClass: string;
    borderClass: string;
    titleColor: string;
    subColor: string;
  }
> = {
  invite_members: {
    icon: "👥",
    bgClass: "bg-sage-ghost",
    borderClass: "border-sage/20",
    titleColor: "text-bronze",
    subColor: "text-bronze/70",
  },
  create_campaign: {
    icon: "📋",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-200",
    titleColor: "text-indigo-800",
    subColor: "text-indigo-600",
  },
  await_completions: {
    icon: "⏳",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    titleColor: "text-amber-800",
    subColor: "text-amber-600",
  },
  ready: {
    icon: "✅",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    titleColor: "text-emerald-800",
    subColor: "text-emerald-600",
  },
};

export function NextStepBanner({
  orgId,
  memberCount,
  activeCampaignCount,
  completedMemberCount,
  hexacoAvg,
  isHu,
}: NextStepBannerProps) {
  const loc: Locale = isHu ? "hu" : "en";
  const state = getStepState({
    orgId,
    memberCount,
    activeCampaignCount,
    completedMemberCount,
    hexacoAvg,
    isHu,
  });

  if (state === "ready") return null;

  const cfg = STEP_CONFIG[state];

  const title = {
    invite_members: t("org.nextStep.inviteTitle", loc),
    create_campaign: t("org.nextStep.campaignTitle", loc),
    await_completions: tf("org.nextStep.awaitTitle", loc, { completed: completedMemberCount }),
  }[state];

  const sub = {
    invite_members: t("org.nextStep.inviteSub", loc),
    create_campaign: t("org.nextStep.campaignSub", loc),
    await_completions: t("org.nextStep.awaitSub", loc),
  }[state];

  const cta =
    state === "invite_members"
      ? { label: t("org.nextStep.inviteCta", loc), href: `/org/${orgId}?tab=members` }
      : state === "create_campaign"
      ? { label: t("org.nextStep.campaignCta", loc), href: `/org/${orgId}/campaigns/new` }
      : null;

  return (
    <div
      className={[
        "rounded-xl border px-4 py-3 flex items-start justify-between gap-4",
        cfg.bgClass,
        cfg.borderClass,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">{cfg.icon}</span>
        <div>
          <p className={["text-sm font-semibold", cfg.titleColor].join(" ")}>{title}</p>
          <p className={["mt-0.5 text-xs", cfg.subColor].join(" ")}>{sub}</p>
        </div>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className={["shrink-0 text-xs font-semibold whitespace-nowrap hover:underline", cfg.titleColor].join(" ")}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
