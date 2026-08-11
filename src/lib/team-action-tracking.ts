import type { TeamReportActionItem } from "@/lib/team-report";

export type TeamActionTrackingSummary = {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  dueSoon: number;
};

export function actionStatus(
  item: TeamReportActionItem,
): NonNullable<TeamReportActionItem["status"]> {
  return item.status ?? "not_started";
}

export function summarizeTeamActions(
  items: TeamReportActionItem[],
  todayIso: string,
): TeamActionTrackingSummary {
  const weekEnd = new Date(`${todayIso}T00:00:00.000Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const weekEndIso = weekEnd.toISOString().slice(0, 10);

  return items.reduce<TeamActionTrackingSummary>((summary, item) => {
    const status = actionStatus(item);
    summary.total += 1;
    if (status === "done") summary.done += 1;
    if (status === "in_progress") summary.inProgress += 1;
    if (status === "blocked") summary.blocked += 1;
    if (status !== "done" && item.dueDate) {
      if (item.dueDate < todayIso) summary.overdue += 1;
      else if (item.dueDate <= weekEndIso) summary.dueSoon += 1;
    }
    return summary;
  }, { total: 0, done: 0, inProgress: 0, blocked: 0, overdue: 0, dueSoon: 0 });
}
