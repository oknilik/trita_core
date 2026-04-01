import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type PlatformSurface = "self" | "team" | "org";

interface PlatformPageShellProps {
  surface: PlatformSurface;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const SURFACE_ACCENT: Record<PlatformSurface, string> = {
  self: "var(--color-surface-self-accent)",
  team: "var(--color-surface-team-accent)",
  org: "var(--color-surface-org-accent)",
};

const SURFACE_ROOT_CLASS: Record<PlatformSurface, string> = {
  self: "bg-surface-canvas",
  team: "bg-surface-team-accent-soft",
  org: "bg-surface-org-accent-soft",
};

const DEFAULT_CONTENT_CLASS: Record<PlatformSurface, string> = {
  self: "max-w-4xl px-4 py-10",
  team: "max-w-5xl px-4 py-10",
  org: "max-w-5xl px-4 py-10",
};

export function PlatformPageShell({
  surface,
  children,
  className,
  contentClassName,
}: PlatformPageShellProps) {
  const accent = SURFACE_ACCENT[surface];
  const rootStyle = {
    "--platform-surface-accent": accent,
  } as CSSProperties;

  return (
    <div
      data-platform-surface={surface}
      className={cn("min-h-dvh", SURFACE_ROOT_CLASS[surface], className)}
      style={rootStyle}
    >
      <main
        className={cn(
          "mx-auto flex w-full flex-col",
          DEFAULT_CONTENT_CLASS[surface],
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
