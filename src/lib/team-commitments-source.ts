import { createHash } from "node:crypto";
import { parseActionItems, type TeamReportActionItem } from "@/lib/team-report";
import { commitmentDateSchema } from "@/lib/team-commitment-schema";

export interface CommitmentSourceReport {
  id: string;
  title: string | null;
  publishedAt: Date | null;
  actionItems: unknown;
}

/** Public report proposals only: ignore malformed records without renumbering them. */
export function commitmentSourceActions(report: CommitmentSourceReport): Array<{
  sourceActionKey: string;
  item: TeamReportActionItem;
}> {
  if (!Array.isArray(report.actionItems)) return [];
  const actions = report.actionItems.map((raw, index) => ({ index, item: parseActionItems([raw])?.[0] }));
  const idCounts = new Map<string, number>();
  for (const { item } of actions) {
    if (item?.id) idCounts.set(item.id, (idCounts.get(item.id) ?? 0) + 1);
  }
  return actions.flatMap(({ index, item }) => {
    if (!item || !item.title.trim()) return [];
    // Some historical tracker saves stripped ids. Do not grant two proposals
    // the same identity, and do not trust an old array index after republication.
    const sourceActionKey = item.id && item.id.length <= 191 && idCounts.get(item.id) === 1
      ? `id:${item.id}`
      : `legacy:${index}:${createHash("sha256").update(JSON.stringify(item)).digest("hex").slice(0, 24)}`;
    return [{
      sourceActionKey,
      item: {
        ...item,
        dueDate: item.dueDate && commitmentDateSchema.safeParse(item.dueDate).success ? item.dueDate : undefined,
      },
    }];
  });
}
