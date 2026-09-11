import { createHash } from "node:crypto";
import { parseActionItems, type TeamReportActionItem } from "@/lib/team-report";
import { commitmentDateSchema } from "@/lib/team-commitment-schema";

export interface CommitmentSourceReport {
  id: string;
  title: string | null;
  publishedAt: Date | null;
  actionItems: unknown;
}

export interface ImportedCommitmentSource {
  sourceActionKey: string | null;
  sourceSnapshot: unknown;
}

type SourceAction = { sourceActionKey: string; item: TeamReportActionItem };

function publicContent(item: TeamReportActionItem): string {
  // A normal report save assigns missing ids and fills the default status.
  // Neither changes the proposal's published content or creates a new promise.
  return JSON.stringify({
    title: item.title,
    description: item.description,
    timeframe: item.timeframe,
    owner: item.owner ?? null,
    dueDate: item.dueDate ?? null,
    status: item.status ?? "not_started",
    targetMetric: item.targetMetric ?? null,
    evidenceUrl: item.evidenceUrl ?? null,
    note: item.note ?? null,
  });
}

function snapshotAction(snapshot: unknown): TeamReportActionItem | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const action = parseActionItems([(snapshot as Record<string, unknown>).action])?.[0];
  if (!action) return null;
  return { ...action, dueDate: action.dueDate && commitmentDateSchema.safeParse(action.dueDate).success ? action.dueDate : undefined };
}

/** One-to-one matching preserves intentional duplicates while bridging legacy ids. */
export function importedCommitmentSourceKeys(
  actions: SourceAction[],
  imported: ImportedCommitmentSource[],
): Set<string> {
  const matched = new Set<string>();
  const consumed = new Set<number>();
  // Exact identities take precedence: an alias must never consume another
  // current proposal's stable source record merely because its text is equal.
  for (const action of actions) {
    const index = imported.findIndex((source, i) => !consumed.has(i) && source.sourceActionKey === action.sourceActionKey);
    if (index >= 0) { matched.add(action.sourceActionKey); consumed.add(index); }
  }
  for (const action of actions) {
    if (matched.has(action.sourceActionKey)) continue;
    const index = imported.findIndex((source, i) => {
      if (consumed.has(i)) return false;
      const previous = snapshotAction(source.sourceSnapshot);
      if (!previous) return false;
      // Two intentionally separate id-bearing actions remain separate even
      // when every public field happens to have the same value.
      if (previous.id && action.item.id && previous.id !== action.item.id) return false;
      if (!source.sourceActionKey?.startsWith("legacy:") && !action.sourceActionKey.startsWith("legacy:")) return false;
      return publicContent(previous) === publicContent(action.item);
    });
    if (index >= 0) { matched.add(action.sourceActionKey); consumed.add(index); }
  }
  return matched;
}

/** Public report proposals only: ignore malformed records without renumbering them. */
export function commitmentSourceActions(report: CommitmentSourceReport): SourceAction[] {
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
