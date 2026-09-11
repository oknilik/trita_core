import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import type { TeamCommitmentsWorkspace } from "@/lib/team-commitments";
import { commitmentAttention, commitmentCalendarDate, sortCommitments } from "@/lib/team-commitments-view";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { Card } from "@/components/ui/primitives/Card";
import { StatusChip } from "@/components/ui/primitives/StatusChip";

export function TeamCommitmentsOverview({ workspace, isHu }: { workspace: TeamCommitmentsWorkspace; isHu: boolean }) {
  const locale = isHu ? "hu" : "en";
  const isTeamPerspective = workspace.perspective === "team";
  const today = commitmentCalendarDate();
  const openItems = workspace.items.filter((item) => item.status !== "done");
  const ownItems = openItems.filter((item) => item.ownerUserId === workspace.viewerId);
  const item = sortCommitments(isTeamPerspective ? openItems : ownItems, today)[0] ?? null;
  const attention = item ? commitmentAttention(item, today)[0] : null;
  const hasSuggestions = workspace.canManage && workspace.suggestions.length > 0;
  const formatDate = (date: string) => new Date(date).toLocaleDateString(isHu ? "hu-HU" : "en-GB", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
  const emptyKey = workspace.items.length > 0 && openItems.length === 0
    ? "allDone"
    : openItems.length > 0 ? "noOwn" : workspace.canManage ? "emptyManager" : workspace.canUpdateOwn ? "emptyMember" : "emptyReadOnly";
  const actionKey = item ? "openItem" : hasSuggestions ? "import" : workspace.canManage && workspace.items.length === 0 ? "create" : "open";

  return (
    <Card as="section" surface="team">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionEyebrow>{t("teamCommitmentsEntry.tab", locale)}</SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-heading text-ink">{t(`teamCommitmentsEntry.${item ? isTeamPerspective ? "nextForTeam" : "nextForYou" : "overviewTitle"}`, locale)}</h2>
        </div>
        <p className="text-caption text-secondary">{tf(`teamCommitmentsEntry.${isTeamPerspective ? "openCount" : "ownOpenCount"}`, locale, { count: isTeamPerspective ? openItems.length : ownItems.length })}</p>
      </div>
      {workspace.plan.focus ? <p className="mt-3 text-sm font-medium text-ink">{workspace.plan.focus}</p> : null}
      {item ? (
        <div className="mt-4 rounded-xl bg-surface-muted p-4">
          <StatusChip variant={attention === "blocked" || attention === "overdue" ? "warning" : "neutral"}>{t(`teamCommitmentsEntry.${attention ?? (item.status === "in_progress" ? "inProgress" : "planned")}`, locale)}</StatusChip>
          <h3 className="mt-1 text-base font-semibold text-ink">{item.title}</h3>
          {item.nextStep ? <p className="mt-2 text-sm leading-relaxed text-ink-body">{item.nextStep}</p> : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-secondary">
            {item.ownerName ? <p>{tf("teamCommitmentsEntry.owner", locale, { name: item.ownerName })}</p> : null}
            {item.dueDate ? <p>{tf("teamCommitmentsEntry.due", locale, { date: formatDate(item.dueDate) })}</p> : null}
          </div>
        </div>
      ) : <p className="mt-3 text-sm leading-relaxed text-ink-body">{t(`teamCommitmentsEntry.${emptyKey}`, locale)}</p>}
      {!item && hasSuggestions ? <p className="mt-2 text-caption text-ink-body">{tf("teamCommitmentsEntry.importAvailable", locale, { count: workspace.suggestions.length })}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {workspace.plan.nextCheckInDate ? <p className="text-caption text-secondary">{tf("teamCommitmentsEntry.checkIn", locale, { date: formatDate(workspace.plan.nextCheckInDate) })}</p> : null}
        <Link className={getButtonClassName({ variant: "secondary" })} href={`/team/${workspace.teamId}?tab=commitments${item ? `#commitment-${item.id}` : ""}`}>
          {t(`teamCommitmentsEntry.${actionKey}`, locale)}
        </Link>
      </div>
    </Card>
  );
}
