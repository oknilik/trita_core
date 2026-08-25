import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamFeedbackHub } from "@/components/team/TeamFeedbackHub";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";

export function FeedbackTabView({ ctx }: { ctx: TeamTabContext }) {
  const members = ctx.teamData.members.map((member) => ({
    userId: member.userId,
    displayName: member.displayName,
  }));

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamHeroBlock ctx={ctx} active="feedback" />
      <section className="mx-auto w-full max-w-4xl">
        <TeamFeedbackHub teamId={ctx.teamId} members={members} locale={ctx.locale} />
      </section>
    </PlatformPageShell>
  );
}
