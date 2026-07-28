import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export type PlatformSurface = "self" | "team" | "org";

export interface PlatformShellBreadcrumbItem {
  label: ReactNode;
  href?: string;
}

export interface PlatformShellChrome {
  breadcrumb?: PlatformShellBreadcrumbItem[];
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** @deprecated Use `eyebrow` for standardized header copy. */
  topbar?: ReactNode;
  className?: string;
}

interface PlatformPageShellProps {
  surface: PlatformSurface;
  children: ReactNode;
  chrome?: PlatformShellChrome;
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
  chrome,
  className,
  contentClassName,
}: PlatformPageShellProps) {
  const accent = SURFACE_ACCENT[surface];
  const chromeEyebrow = chrome?.eyebrow ?? chrome?.topbar;
  const rootStyle = {
    "--platform-surface-accent": accent,
  } as CSSProperties;

  return (
    <div
      data-platform-surface={surface}
      // pb-16: a hullámos footer -mt-10-zel EBBE a színes sávba húzódik —
      // az él mögött így a felület saját háttere látszik (footer-varrat fix).
      className={cn("min-h-dvh pb-16", SURFACE_ROOT_CLASS[surface], className)}
      style={rootStyle}
    >
      <main
        className={cn(
          "mx-auto flex w-full flex-col",
          DEFAULT_CONTENT_CLASS[surface],
          contentClassName,
        )}
      >
        {chrome ? (
          <section
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border-default bg-surface-card px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)] md:px-5",
              chrome.className,
            )}
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5 bg-[var(--platform-surface-accent)]"
            />

            {chrome.breadcrumb && chrome.breadcrumb.length > 0 ? (
              <nav
                aria-label="Breadcrumb"
                className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px]"
              >
                {chrome.breadcrumb.map((crumb, index) => {
                  const isLast = index === chrome.breadcrumb!.length - 1;
                  return (
                    <span key={`crumb-${index}`} className="inline-flex items-center gap-1.5">
                      {index > 0 ? (
                        <span className="text-text-muted/60">/</span>
                      ) : null}
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          className="text-text-secondary transition-colors hover:text-text-primary"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="font-medium text-text-primary">{crumb.label}</span>
                      )}
                    </span>
                  );
                })}
              </nav>
            ) : null}

            {chromeEyebrow ? (
              <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-[var(--platform-surface-accent)]"
                />
                {chromeEyebrow}
              </div>
            ) : null}

            {(chrome.title || chrome.subtitle || chrome.actions) ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  {chrome.title ? (
                    <h1 className="font-fraunces text-2xl tracking-tight text-text-primary md:text-3xl">
                      {chrome.title}
                    </h1>
                  ) : null}
                  {chrome.subtitle ? (
                    <p className="mt-1.5 text-sm text-text-secondary">{chrome.subtitle}</p>
                  ) : null}
                </div>
                {chrome.actions ? (
                  <div className="shrink-0">{chrome.actions}</div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
        {children}
      </main>
    </div>
  );
}
