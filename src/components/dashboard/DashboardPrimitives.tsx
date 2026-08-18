import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import { StatusChip } from "@/components/ui/primitives/StatusChip";

type PanelTone = "white" | "warm" | "cream";

export function DashboardSectionHeader({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-px w-4 bg-bronze/70" />
      <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
        {label}
      </p>
    </div>
  );
}

export function DashboardPanel({
  children,
  tone = "white",
  className,
}: {
  children: ReactNode;
  tone?: PanelTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-sand shadow-[0_16px_40px_rgba(26,26,46,0.04)]",
        tone === "white" && "bg-surface-card",
        tone === "warm" && "bg-warm",
        tone === "cream" && "bg-cream",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardMetricCard({
  accent,
  title,
  value,
  suffix,
  sub,
  progressPct,
  progressColor,
  valueColor,
  children,
  className,
}: {
  accent: string;
  title: string;
  value: string;
  suffix?: string;
  sub?: string;
  progressPct?: number;
  progressColor?: string;
  valueColor?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <DashboardPanel className={cn("relative overflow-hidden px-5 pb-5 pt-5", className)}>
      <div
        className="absolute left-5 right-5 top-0 h-[3px] rounded-b-full"
        style={{ background: accent }}
      />
      <p className="mb-2 font-dm-sans text-micro font-semibold uppercase tracking-widest text-muted">
        {title}
      </p>
      <p
        className="font-fraunces text-title leading-none tracking-tight"
        style={{ color: valueColor ?? "var(--color-sage-deep)" }}
      >
        {value}
        {suffix ? (
          <sub className="ml-1 text-body font-medium tracking-normal opacity-35">
            {suffix}
          </sub>
        ) : null}
      </p>
      {children ? <div className="mt-3">{children}</div> : null}
      {sub ? (
        <p className="mt-2 text-note leading-[1.55] text-ink-body">{sub}</p>
      ) : null}
      {progressPct != null && progressColor ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(progressPct, 100)}%`,
              background: progressColor,
            }}
          />
        </div>
      ) : null}
    </DashboardPanel>
  );
}

type StatusTone = "sage" | "bronze" | "warm" | "rose" | "muted";

export function DashboardStatusChip({
  label,
  tone = "muted",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  const toneConfig = {
    sage: { variant: "info", className: "bg-sage-soft text-sage-dark" },
    bronze: { variant: "warning", className: "bg-bronze/10 text-bronze-dark" },
    warm: { variant: "warning", className: "bg-[var(--color-surface-chip-warm-soft)] text-[var(--color-accent-primary-strong)]" },
    rose: { variant: "error", className: "bg-[var(--color-state-error-bg)] text-[var(--color-state-error-fg)]" },
    muted: { variant: "neutral", className: "bg-cream text-ink-body" },
  } as const;
  const config = toneConfig[tone];

  return (
    <StatusChip
      variant={config.variant}
      className={cn("px-2.5 py-[4px] text-micro", config.className, className)}
    >
      {label}
    </StatusChip>
  );
}

export function DashboardActionCard({
  eyebrow,
  title,
  body,
  cta,
  tone = "white",
  className,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  cta?: { href: string; label: string; tone?: "soft" | "solid" | "link" };
  tone?: PanelTone;
  className?: string;
}) {
  return (
    <DashboardPanel tone={tone} className={cn("p-5", className)}>
      <p className="font-dm-sans text-micro font-semibold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-fraunces text-title leading-none tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-3 text-caption leading-[1.65] text-ink-body">{body}</div>
      {cta ? (
        <Link
          href={cta.href}
          className={cn(
            "mt-4 inline-flex min-h-[42px] items-center rounded-[10px] px-4 py-2 text-xs font-semibold no-underline transition",
            cta.tone === "solid" && "bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] hover:brightness-110",
            cta.tone === "link" && "px-0 py-0 text-[var(--color-accent-primary-strong)] hover:text-bronze-dark",
            (!cta.tone || cta.tone === "soft") &&
              "bg-sage-soft text-sage-dark hover:bg-[#dfeae5]",
          )}
        >
          {cta.label}
        </Link>
      ) : null}
    </DashboardPanel>
  );
}
