import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  /**
   * A gomb olyan panelen ül, ami MINDKÉT színsémán sötét (réteg-hero).
   * Ilyenkor a tiltott állapot és a fókuszgyűrű-eltolás az inverz készletet
   * kapja — a világos `state-disabled-*` tokenek sötét alapon eltűnnek.
   */
  onInverse?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

interface ButtonClassNameOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Sötét (hero) panelen ül — ld. `onInverse` a ButtonProps-ban. */
  onInverse?: boolean;
  className?: string;
}

/**
 * Tiltott állapot VILÁGOS felületen. A `state-disabled-*` tokenek világos
 * meleg szürkék — pontosan azok kellenek egy krém lapon.
 */
const DISABLED_CLASSES =
  "disabled:bg-state-disabled-bg disabled:text-state-disabled-fg disabled:opacity-50";

/**
 * Tiltott állapot SÖTÉT panelen (`onInverse`).
 *
 * A világos készlet itt eltűnik: a `state-disabled-bg` egy világos meleg
 * szürke, a `state-disabled-fg` egy hideg-szürke felirat, és rájön még egy
 * 50%-os áttetszőség. A jelölt-hero terrakotta paneljén ez egy alig látható,
 * kékes-szürke folttá mosta a gombot (2026-08-09). Fontos, hogy ezek
 * `disabled:` prefixű osztályok: a hívó `className`-jében megadott sima
 * `text-*`/`bg-*` NEM tudja felülírni őket, mert a pszeudo-osztályos
 * szelektor specifikusabb — ezért kell a primitívben megoldani, nem a
 * hívási helyen.
 */
const DISABLED_ON_INVERSE_CLASSES =
  "disabled:bg-white/[0.08] disabled:text-[var(--color-text-on-inverse-muted)] disabled:opacity-100 disabled:border-white/20";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg-hover",
  secondary:
    "border border-action-secondary-border bg-action-secondary-bg text-action-secondary-fg hover:border-state-hover-border hover:bg-state-hover-bg hover:text-state-hover-fg disabled:border-state-disabled-border",
  ghost: "bg-transparent text-action-secondary-fg hover:bg-state-hover-bg hover:text-state-hover-fg",
  destructive: "bg-action-destructive-bg text-action-destructive-fg hover:bg-action-destructive-bg-hover",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[40px] px-[var(--ui-space-4)] text-sm",
  md: "min-h-[44px] px-[var(--ui-space-5)] text-sm",
  lg: "min-h-[48px] px-[var(--ui-space-6)] text-sm",
};

export function getButtonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  onInverse = false,
  className,
}: ButtonClassNameOptions = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-[var(--ui-space-2)] rounded-[var(--ui-radius-lg)] font-semibold transition",
    "duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring focus-visible:ring-offset-2",
    onInverse
      ? "focus-visible:ring-offset-transparent"
      : "focus-visible:ring-offset-surface-canvas",
    "disabled:pointer-events-none disabled:cursor-not-allowed",
    onInverse ? DISABLED_ON_INVERSE_CLASSES : DISABLED_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && "w-full",
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    fullWidth = false,
    onInverse = false,
    iconLeft,
    iconRight,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={getButtonClassName({ variant, size, fullWidth, onInverse, className })}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        iconLeft
      )}
      {children}
      {!loading ? iconRight : null}
    </button>
  );
});
