import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamProfileTab } from "@/components/team/TeamProfileTab";
import { TeamTabBar } from "./TeamTabBar";
import type { TeamTabContext } from "./types";

// ── Profile tab: heatmap + insights ──────────────────────────────────────
export function ProfileTabView({ ctx }: { ctx: TeamTabContext }) {
  const { teamId, teamData, locale, isHu } = ctx;
  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamTabBar ctx={ctx} active="profile" showTeamName />
      <TeamProfileTab
        heatmapRows={teamData.heatmapRows}
        dimConfigs={teamData.dimConfigs}
        locale={locale}
        isHu={isHu}
      />
    </PlatformPageShell>
  );
}
