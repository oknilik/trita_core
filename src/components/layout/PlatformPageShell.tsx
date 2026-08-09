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

// A lap alapszíne — 2026-08-09 óta MINDEN rétegen ugyanaz a krém vászon,
// ami a főoldalé.
//
// Korábban rétegenként külön „szoba-tónus" (wash) festette a lapot: a
// csapat homokos, a szervezet KÉK. Egy végig meleg rendszerben (a többi
// felület h24–38 között mozog) a szervezet h212-es hideg kékje idegen
// testként ült — és mivel a self már addig is sima krém volt, a rendszer
// önmagával sem volt következetes.
//
// A réteg-identitást ezután a hero viszi (az mind a négy rétegen saját,
// telített gradiens), plusz az akcent-tokenek a chrome-on. A wash-tokenek
// szándékosan a helyükön maradnak: ha a réteg-tónus mégis hiányzik
// görgetés után, egy soros visszaállítás.
const SURFACE_ROOT_CLASS: Record<PlatformSurface, string> = {
  self: "bg-surface-canvas",
  team: "bg-surface-canvas",
  org: "bg-surface-canvas",
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
      // pb-16: a hullámos footer -mt-10-zel EBBE a sávba húzódik — az él
      // mögött így a lap saját háttere látszik (footer-varrat fix). A sáv
      // most már mindenhol krém, de a párnázás továbbra is kell.
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

            {/* Morzsasáv (2026-08-05 modernizálás): lista-szemantika (ol/li),
                finom chevron-szeparátor a nyers „/" helyett, text-caption/muted
                tipográfia, az utolsó (aktuális) elem text-primary/medium +
                aria-current="page". A linkek 44px-es érintő-célt kapnak — a
                negatív függőleges margó tartja kompaktan a sávot —, a hosszú
                címkék truncate-elnek (mobile-first). */}
            {chrome.breadcrumb && chrome.breadcrumb.length > 0 ? (
              <nav aria-label="Breadcrumb" className="-my-2.5 mb-0.5">
                <ol className="flex flex-wrap items-center gap-0.5 text-caption text-text-muted">
                  {chrome.breadcrumb.map((crumb, index) => {
                    const isLast = index === chrome.breadcrumb!.length - 1;
                    return (
                      <li key={`crumb-${index}`} className="flex min-w-0 items-center gap-0.5">
                        {index > 0 ? (
                          <svg
                            aria-hidden
                            viewBox="0 0 12 12"
                            className="h-3 w-3 shrink-0 text-text-muted/60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4.5 2.5 8 6l-3.5 3.5" />
                          </svg>
                        ) : null}
                        {crumb.href && !isLast ? (
                          <Link
                            href={crumb.href}
                            className="inline-flex min-h-[44px] items-center rounded-md px-1 transition-colors hover:text-text-primary"
                          >
                            <span className="max-w-[9rem] truncate md:max-w-[18rem]">
                              {crumb.label}
                            </span>
                          </Link>
                        ) : (
                          <span
                            aria-current={isLast ? "page" : undefined}
                            className="inline-flex min-h-[44px] items-center px-1 font-medium text-text-primary"
                          >
                            <span className="max-w-[13rem] truncate md:max-w-[24rem]">
                              {crumb.label}
                            </span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : null}

            {/* Shell-eyebrow: az egységes pötty+label alak (ld. SectionEyebrow),
                a pötty a felület akcent-színét hordozza. */}
            {chromeEyebrow ? (
              <div className="mb-2 inline-flex items-center gap-2 text-label uppercase text-text-secondary">
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
