import type { SerializedTeamReport, TeamReportAggregates } from "./team-report";
import { AXES } from "./team-operating-style/questions";

/** Shared web/PDF reading hierarchy. No new scores or inferred commitments. */
export function reportAttentionSignals(agg: TeamReportAggregates | null, isHu: boolean): string[] {
  const signals: string[] = [];
  if (agg?.psychSafety?.band === "low") signals.push(isHu
    ? `A pszichológiai biztonság mért eredménye alacsony (${agg.psychSafety.index}/100, ${agg.psychSafety.count} névtelen válasz). Beszéljétek át, mi nehezíti a kérdezést és a problémák jelzését.`
    : `Measured psychological safety is low (${agg.psychSafety.index}/100, ${agg.psychSafety.count} anonymous responses). Discuss what makes asking questions and raising problems difficult.`);
  if (agg?.trustHighlights?.source === "trust_round" && agg.trustHighlights.isolated.length > 0) signals.push(isHu
    ? `A mért bizalmi kör ${agg.trustHighlights.isolated.length} tagnál jelez gyenge beágyazottságot. Tisztázzátok, hogyan lehet könnyebb kapcsolódni a közös munkához.`
    : `The measured trust round flags weak integration for ${agg.trustHighlights.isolated.length} member(s). Discuss how to make joining the shared work easier.`);
  return signals;
}

export function reportNextStep(report: SerializedTeamReport, isHu: boolean) {
  const action = report.actionItems?.find((item) => item.status !== "done");
  if (action) return {
    kind: "recorded" as const, title: action.title, description: action.description,
    owner: action.owner || (isHu ? "Még nincs kijelölve" : "Not assigned yet"),
    when: action.dueDate || `${action.timeframe} ${isHu ? "napos fókusz" : "day focus"}`,
  };
  if (report.actionItems?.length) return {
    kind: "review" as const,
    title: isHu ? "Mi vált be a közös vállalásokból?" : "What worked in your commitments?",
    description: isHu ? "A rögzített lépések elkészültek. Nézzétek meg, mit érdemes megtartani, módosítani vagy elengedni." : "The recorded steps are complete. Review what to keep, change or stop.",
    owner: isHu ? "Közösen kijelölendő" : "To agree together", when: isHu ? "A következő visszatekintésen" : "At the next review",
  };
  const op = report.aggregates?.teamStyle?.operating;
  // A suggested discussion is never written to actionItems or presented as agreed.
  const executionNeedsDiscussion = op && AXES.every((axis) => op.axes[axis].mean !== null)
    && (op.patternUnavailableReason === "different_cohorts" || op.axes.execution.flags.includes("near_midpoint"));
  return {
    kind: "suggested" as const,
    title: executionNeedsDiscussion
      ? isHu ? "Mikor tartjátok a tervet, és mikor változtattok?" : "When do you follow the plan, and when do you adapt?"
      : isHu ? "Melyik közös szokáson érdemes először változtatni?" : "Which shared habit is worth changing first?",
    description: executionNeedsDiscussion
      ? isHu ? "Hozzatok egy-egy közelmúltbeli példát mindkét helyzetre. Tisztázzátok, mit értettetek a kérdőív állításai alatt, majd fogalmazzatok meg egy kipróbálható közös szabályt." : "Bring a recent example of each situation. Clarify how you understood the questionnaire statements, then agree on one shared rule to try."
      : isHu ? "Válasszatok egy konkrét munkahelyzetet. Beszéljétek át, mi segítette és mi nehezítette az együttműködést, majd jelöljetek ki egy kipróbálható változtatást." : "Choose a specific work situation. Discuss what helped and hindered collaboration, then identify one change to try.",
    owner: isHu ? "Közösen kijelölendő" : "To agree together", when: isHu ? "A következő értelmezési alkalmon" : "At the next debrief",
  };
}
