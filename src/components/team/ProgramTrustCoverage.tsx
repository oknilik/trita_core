import {
  programObserverLines,
  programTrustLines,
  type ProgramReportEvidence,
} from "@/lib/programs/report";
import { t } from "@/lib/i18n";
export function ProgramTrustCoverage({
  program,
  isHu,
}: {
  program?: ProgramReportEvidence;
  isHu: boolean;
}) {
  const lines = programTrustLines(program, isHu);
  const observerLines = programObserverLines(program, isHu);
  if (!lines.length && !observerLines.length) return null;
  return (
    <section className="rounded-xl border border-sand bg-surface-card p-5">
      {lines.length > 0 && (
        <h3 className="font-fraunces text-heading">
          {t("programTrust.title", isHu ? "hu" : "en")}
        </h3>
      )}
      {[...lines, ...observerLines].map((line) => (
        <p key={line} className="mt-2 text-caption text-muted">
          {line}
        </p>
      ))}
    </section>
  );
}
