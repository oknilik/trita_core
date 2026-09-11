import type { TeamCommitment } from "@/lib/team-commitments";

export type CommitmentAttention = "blocked" | "overdue" | "unassigned" | "stale";

/** Calendar dates use the viewer's local day; UTC conversion can change a date near midnight. */
export function commitmentCalendarDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayNumber(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function commitmentAttention(item: TeamCommitment, todayIso: string): CommitmentAttention[] {
  if (item.status === "done") return [];
  const reasons: CommitmentAttention[] = [];
  if (item.status === "blocked") reasons.push("blocked");
  if (item.dueDate && item.dueDate < todayIso) reasons.push("overdue");
  if (!item.ownerUserId) reasons.push("unassigned");
  const updated = new Date(item.updatedAt);
  if (Number.isFinite(updated.getTime()) && dayNumber(todayIso) - dayNumber(commitmentCalendarDate(updated)) > 7) reasons.push("stale");
  return reasons;
}

/** A commitment appears once, with its highest-priority reason deciding its position. */
export function sortCommitments(items: TeamCommitment[], todayIso: string): TeamCommitment[] {
  const priorities: CommitmentAttention[] = ["blocked", "overdue", "unassigned", "stale"];
  const rank = (item: TeamCommitment) => {
    const first = commitmentAttention(item, todayIso)[0];
    return first ? priorities.indexOf(first) : item.status === "done" ? 6 : item.status === "in_progress" ? 4 : 5;
  };
  return [...items].sort((a, b) => rank(a) - rank(b)
    || (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31")
    || a.updatedAt.localeCompare(b.updatedAt)
    || a.id.localeCompare(b.id));
}
