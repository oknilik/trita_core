import type { ReactNode } from "react";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  SparklesIcon,
} from "@/components/ui/icons";

export type StatePanelTone = "success" | "error" | "pending" | "locked" | "empty";

const TONE_CLASS: Record<StatePanelTone, string> = {
  success: "border-sage/30 bg-sage/10 text-sage-dark",
  error: "border-state-error-border bg-state-error-bg text-state-error-fg",
  pending: "border-bronze/30 bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]",
  locked: "border-sand bg-[var(--color-surface-subtle)] text-muted",
  empty: "border-sand bg-[var(--color-surface-subtle)] text-[var(--color-accent-primary-strong)]",
};

function StateIcon({ tone }: { tone: StatePanelTone }) {
  const className = "h-6 w-6";
  if (tone === "success") return <CheckIcon className={className} />;
  if (tone === "error") return <AlertIcon className={className} />;
  if (tone === "pending") return <ClockIcon className={className} />;
  if (tone === "locked") return <LockIcon className={className} />;
  return <SparklesIcon className={className} />;
}

export function StatePanel({
  tone,
  title,
  body,
  action,
  compact = false,
  className = "",
  headingLevel = "h2",
}: {
  tone: StatePanelTone;
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    <section
      className={`flex flex-col items-center text-center ${compact ? "p-7" : "p-8 md:p-10"} ${className}`}
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${TONE_CLASS[tone]}`}>
        <StateIcon tone={tone} />
      </div>
      <Heading className="mt-5 font-fraunces text-2xl font-medium text-ink">{title}</Heading>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-body">{body}</p>
      {action ? <div className="mt-7">{action}</div> : null}
    </section>
  );
}

export function PageState(props: Omit<Parameters<typeof StatePanel>[0], "className">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-16">
      <StatePanel {...props} headingLevel="h1" className="w-full max-w-xl border-y border-sand/80" />
    </main>
  );
}
