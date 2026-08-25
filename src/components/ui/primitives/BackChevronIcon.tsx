import { cn } from "@/lib/ui/cn";

interface BackChevronIconProps {
  size?: "sm" | "md";
  tone?: "default" | "accent";
  className?: string;
}

const sizeClasses = {
  sm: "size-7 rounded-[9px] [&_svg]:size-3.5",
  md: "size-8 rounded-[10px] [&_svg]:size-4",
} as const;

/**
 * A trita egységes visszalépési jele: rövid chevron puha ikonkeretben.
 * A feliratot a hívó adja, az ikon mindenhol dekoratív marad.
 */
export function BackChevronIcon({
  size = "md",
  tone = "default",
  className,
}: BackChevronIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors",
        tone === "accent"
          ? "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)] group-hover:bg-[var(--color-accent-primary-soft)]"
          : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-border-default)] group-hover:text-[var(--color-text-primary)]",
        sizeClasses[size],
        className,
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.5 4.5 7 10l5.5 5.5" />
      </svg>
    </span>
  );
}
