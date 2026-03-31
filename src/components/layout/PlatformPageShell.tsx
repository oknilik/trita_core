import type { CSSProperties, ReactNode } from "react";

export type PlatformSurface = "self" | "team" | "org";

interface PlatformPageShellProps {
  surface: PlatformSurface;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const SURFACE_ACCENT: Record<PlatformSurface, string> = {
  self: "#3d6b5e",
  team: "#d48e62",
  org: "#3f6d9a",
};

const DEFAULT_CONTENT_CLASS: Record<PlatformSurface, string> = {
  self: "max-w-4xl px-4 py-10",
  team: "max-w-5xl px-4 py-10",
  org: "max-w-5xl px-4 py-10",
};

function mergeClasses(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

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
      className={mergeClasses("min-h-dvh bg-cream", className)}
      style={rootStyle}
    >
      <main
        className={mergeClasses(
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
