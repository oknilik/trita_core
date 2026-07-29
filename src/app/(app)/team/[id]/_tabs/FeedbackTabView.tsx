import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamKudos } from "@/components/team/TeamKudos";
import { TeamFeedbackRequests } from "@/components/team/TeamFeedbackRequests";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";

// ── Visszajelzés fül (peer feedback): kitüntetett hely, csak csapattagnak ──
// A csapattag-guard a page.tsx-ben fut (redirect), ide már csak tag jut.
export function FeedbackTabView({ ctx }: { ctx: TeamTabContext }) {
  const { teamId, teamData, locale, isHu } = ctx;
  const feedbackMembers = teamData.members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
  }));
  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-3xl gap-6 px-4 py-8 md:px-6"
    >
      <TeamHeroBlock ctx={ctx} active="feedback" />
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {isHu ? "// visszajelzés" : "// feedback"}
        </p>
        <h1 className="mt-1 font-fraunces text-3xl text-ink">
          {isHu ? "Visszajelzések" : "Feedback"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-body">
          {isHu
            ? "Köszönet és fejlesztő visszajelzés a csapattársaidnak — nevesítve épít, kérésre érkezve hasznosul."
            : "Kudos and development feedback for your teammates — named feedback builds, requested feedback lands."}
        </p>
      </div>
      <TeamKudos teamId={teamId} members={feedbackMembers} locale={locale} />
      <TeamFeedbackRequests teamId={teamId} members={feedbackMembers} locale={locale} />
    </PlatformPageShell>
  );
}
