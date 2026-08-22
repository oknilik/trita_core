import { cn } from "@/lib/ui/cn";

export type AuthLeftPanelContext =
  | "explore"
  | "team"
  | "observer"
  | "signin"
  | "verify"
  | null;

interface AuthLeftPanelProps {
  context: AuthLeftPanelContext;
  className?: string;
}

export default function AuthLeftPanel({ className }: AuthLeftPanelProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative hidden min-h-full w-[320px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] lg:flex",
        className,
      )}
    >
      <div className="absolute size-[250px] rounded-full border border-white/[0.035] bg-black/[0.05]" />
      <svg viewBox="0 0 320 520" className="relative h-auto w-full" focusable="false">
        <circle cx="160" cy="260" r="94" fill="rgba(0,0,0,0.07)" />
        <g
          transform="translate(160 260)"
          stroke="var(--color-accent-primary-soft)"
          strokeWidth="12"
          strokeLinecap="round"
        >
          <line x1="0" y1="-72" x2="0" y2="72" />
          <line x1="-72" y1="0" x2="72" y2="0" />
          <line x1="-51" y1="-51" x2="51" y2="51" />
          <line x1="51" y1="-51" x2="-51" y2="51" />
        </g>
        <circle cx="226" cy="154" r="25" fill="var(--color-accent-primary)" />
        <circle cx="85" cy="376" r="15" fill="var(--color-sage-300)" />
        <circle cx="160" cy="260" r="6" fill="var(--color-text-on-inverse)" />
      </svg>
    </div>
  );
}
