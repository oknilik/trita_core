import Link from "next/link";
import { t } from "@/lib/i18n";
import { getTeamCommitmentsWorkspace } from "@/lib/team-commitments.server";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamCommitments } from "@/components/team/TeamCommitments";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";

export async function CommitmentsTabView({ ctx }: { ctx: TeamTabContext }) {
  const result = await getTeamCommitmentsWorkspace(ctx.teamId, ctx.profile.id);
  return (
    <PlatformPageShell surface="team" contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6">
      <TeamHeroBlock ctx={ctx} active="commitments" />
      {"workspace" in result ? (
        <TeamCommitments initialWorkspace={result.workspace} isHu={ctx.isHu} />
      ) : (
        <InlineBanner variant="info" title={t("teamCommitmentsEntry.unavailableTitle", ctx.locale)}>
          <p>{t(result.status === 403 ? "teamCommitmentsEntry.accessDescription" : "teamCommitmentsEntry.unavailableDescription", ctx.locale)}</p>
          <Link className={getButtonClassName({ variant: "secondary", className: "mt-4" })} href={`/team/${ctx.teamId}?tab=overview`}>
            {t("teamCommitmentsEntry.backOverview", ctx.locale)}
          </Link>
        </InlineBanner>
      )}
    </PlatformPageShell>
  );
}
