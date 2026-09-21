import type { ReactNode } from "react";
import { AssessmentFlowShell } from "@/components/assessment/AssessmentFlowShell";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { Card } from "@/components/ui/primitives/Card";

/** Candidate-specific overview; question screens keep the shared assessment shell. */
export function CandidateWorkshopIntro({
  eyebrow,
  title,
  campaignName,
  body,
  overview,
  notice,
  action,
  meta,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  campaignName?: ReactNode;
  body: ReactNode;
  overview: ReactNode;
  notice: ReactNode;
  action: ReactNode;
  meta: ReactNode;
}) {
  return (
    <AssessmentFlowShell width="compact" centered>
      <SectionEyebrow tone="candidate">{eyebrow}</SectionEyebrow>
      <h1 className="mt-4 text-center font-fraunces text-title text-ink">
        {title}
      </h1>
      {campaignName && (
        <p className="mt-2 text-center text-caption text-muted">
          {campaignName}
        </p>
      )}
      <p className="mt-5 text-center text-body text-ink-body">{body}</p>
      {overview}
      <Card variant="muted" className="mt-6 w-full text-caption text-ink-body">
        {notice}
      </Card>
      <div className="mt-6">{action}</div>
      <p className="mt-3 text-note text-muted">{meta}</p>
    </AssessmentFlowShell>
  );
}
