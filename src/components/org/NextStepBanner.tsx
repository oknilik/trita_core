"use client";

import Link from "next/link";

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
    bgClass: "bg-[#fff5f0]",
    borderClass: "border-[#c8410a]/20",
    titleColor: "text-[#c8410a]",
    subColor: "text-[#c8410a]/70",
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

  const title = isHu
    ? {
        invite_members: "Hívj meg legalább 3 tagot a szervezetbe",
        create_campaign: "Hozz létre egy kampányt",
        await_completions: `Várakozás kitöltésekre · ${completedMemberCount}/3`,
      }[state]
    : {
        invite_members: "Invite at least 3 members to your org",
        create_campaign: "Create your first campaign",
        await_completions: `Waiting for completions · ${completedMemberCount}/3`,
      }[state];

  const sub = isHu
    ? {
        invite_members: "Minimum 3 kitöltés szükséges a szervezeti profil megjelenítéséhez.",
        create_campaign: "Indíts egy 360° kampányt, hogy a tagok megkezdhessék a kitöltést.",
        await_completions: "A szervezeti profil 3 befejezett értékelés után jelenik meg.",
      }[state]
    : {
        invite_members: "At least 3 completions are needed to display the org personality profile.",
        create_campaign: "Start a 360° campaign so members can begin their assessments.",
        await_completions: "The org personality profile appears after 3 completed assessments.",
      }[state];

  const cta =
    state === "invite_members"
      ? { label: isHu ? "Tagok →" : "Members →", href: `/org/${orgId}?tab=members` }
      : state === "create_campaign"
      ? { label: isHu ? "Kampány →" : "Campaign →", href: `/org/${orgId}/campaigns/new` }
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
