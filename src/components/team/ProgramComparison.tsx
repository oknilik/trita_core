import { t } from "@/lib/i18n";
import {
  AXIS_LABELS,
  type OperatingAxis,
} from "@/lib/team-operating-style/questions";
import {
  programComparisonLines,
  type ProgramReportEvidence,
} from "@/lib/programs/report";

export function ProgramComparison({
  program,
  isHu,
}: {
  program?: ProgramReportEvidence;
  isHu: boolean;
}) {
  if (!program?.baseline) return null;
  const lines = programComparisonLines(program, isHu);
  const rows = (program.operatingChanges ?? []).map((d) => ({
    ...d,
    label: AXIS_LABELS[d.axis as OperatingAxis].name[isHu ? "hu" : "en"],
  }));
  if (program.psychSafetyChange)
    rows.push({
      ...program.psychSafetyChange,
      axis: "psych",
      label: t("programUi.psychSafety", isHu ? "hu" : "en"),
    });
  return (
    <section className="rounded-xl border border-sand bg-surface-card p-5">
      <h3 className="font-fraunces text-heading">
        {t("programUi.comparisonTitle", isHu ? "hu" : "en")}
      </h3>
      <p className="mt-2 text-caption text-muted">{lines[0]}</p>
      {program.cohortChanged && (
        <p className="mt-3 text-caption text-muted">{lines[1]}</p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-caption">
          <thead>
            <tr>
              {["measure", "previous", "current", "difference"]
                .map((key) => t(`programReview.${key}`, isHu ? "hu" : "en"))
                .map((label) => (
                  <th key={label} className="border-b border-sand p-2">
                    {label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.axis}>
                <th scope="row" className="p-2 font-medium">
                  {row.label}
                </th>
                <td className="p-2 tabular-nums">{row.previous.toFixed(1)}</td>
                <td className="p-2 tabular-nums">{row.current.toFixed(1)}</td>
                <td className="p-2 tabular-nums">
                  {row.delta > 0 ? "+" : ""}
                  {row.delta.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-note text-muted">{lines.at(-1)}</p>
    </section>
  );
}
