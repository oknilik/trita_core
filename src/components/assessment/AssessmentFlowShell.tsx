import type { ReactNode } from "react";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { StatePanel } from "@/components/ui/primitives/StatePanel";

type StatusTone = "success" | "error" | "empty";

export const assessmentPrimaryActionClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110";

export function AssessmentFlowShell({
  children,
  width = "wide",
  centered = false,
}: {
  children: ReactNode;
  width?: "compact" | "wide";
  centered?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full flex-col px-4 pb-20 pt-8 ${
        width === "compact" ? "max-w-xl" : "max-w-2xl"
      } ${centered ? "items-center justify-center py-12" : ""}`}
    >
      {children}
    </div>
  );
}

export function AssessmentIntro({
  eyebrow,
  title,
  campaignName,
  body,
  notice,
  action,
  meta,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  campaignName?: ReactNode;
  body: ReactNode;
  notice?: ReactNode;
  action: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <AssessmentFlowShell width="compact" centered>
      <SectionEyebrow tone="team">{eyebrow}</SectionEyebrow>
      <h1 className="mt-4 max-w-lg text-center font-fraunces text-3xl leading-tight text-ink md:text-4xl">
        {title}
      </h1>
      {campaignName ? (
        <p className="mt-2 text-center text-caption font-medium text-muted">{campaignName}</p>
      ) : null}
      <p className="mt-5 max-w-md text-center text-sm leading-relaxed text-ink-body">{body}</p>
      {notice ? (
        <div className="mt-7 w-full border-y border-sage/25 bg-sage/5 px-4 py-4">
          <p className="text-caption leading-relaxed text-ink-body">{notice}</p>
        </div>
      ) : null}
      <div className="mt-8">{action}</div>
      {meta ? <p className="mt-3 text-note font-medium text-muted">{meta}</p> : null}
    </AssessmentFlowShell>
  );
}

export function AssessmentFlowHeader({
  eyebrow,
  progress,
  children,
}: {
  eyebrow: ReactNode;
  progress?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-sand/70 pb-4">
      <div className="flex items-center justify-between gap-4">
        <SectionEyebrow tone="team">{eyebrow}</SectionEyebrow>
        {progress ? <p className="text-note font-medium text-muted">{progress}</p> : null}
      </div>
      {children}
    </header>
  );
}

export function AssessmentStatus({
  tone,
  title,
  body,
  action,
}: {
  tone: StatusTone;
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <AssessmentFlowShell width="compact" centered>
      <StatePanel tone={tone} title={title} body={body} action={action} />
    </AssessmentFlowShell>
  );
}
