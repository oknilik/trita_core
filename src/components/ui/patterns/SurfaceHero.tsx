import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type SurfaceHeroVariant = "self" | "team" | "org" | "career";

interface SurfaceHeroTheme {
  background: string;
  primary: string;
  badgeBg: string;
  badgeText: string;
}

export const SURFACE_HERO_THEME: Record<SurfaceHeroVariant, SurfaceHeroTheme> = {
  self: {
    background:
      "linear-gradient(135deg, var(--color-accent-self-strong) 0%, var(--color-accent-self-deep) 60%, var(--color-accent-self-deeper) 100%)",
    primary: "var(--color-accent-primary)",
    badgeBg: "rgba(193,127,74,0.2)",
    badgeText: "var(--color-accent-primary-soft)",
  },
  team: {
    background: "linear-gradient(135deg, #66455d 0%, #4a314a 60%, #2f2035 100%)",
    primary: "#d48e62",
    badgeBg: "rgba(212,142,98,0.22)",
    badgeText: "#f3c39d",
  },
  org: {
    background: "linear-gradient(135deg, #2f4863 0%, #22374d 60%, #172737 100%)",
    primary: "#d2a36a",
    badgeBg: "rgba(210,163,106,0.22)",
    badgeText: "#f4c792",
  },
  // Karrier — agyag/rozsda. A hero-szín a FELÜLET azonosítója: a self
  // zsálya (~160°), a team szilva (~310°), az org pala (~210°). A meleg
  // vörös-narancs (~15°) az egyetlen szabad régió, tehát ez van a
  // legtávolabb mindháromtól — félhomályban sem téveszthető össze.
  //
  // Az akcentus szándékosan VILÁGOS borostyán, nem a sima bronz: bronz
  // agyagon ~2,5:1 kontrasztot adna (olvashatatlan), így ~5,7:1.
  career: {
    background: "linear-gradient(135deg, #6b4034 0%, #4e2e25 60%, #331e18 100%)",
    primary: "#e0a678",
    badgeBg: "rgba(224,166,120,0.22)",
    badgeText: "#f6d3b1",
  },
};

interface SurfaceHeroProps {
  variant: SurfaceHeroVariant;
  eyebrow?: ReactNode;
  badge?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  summary?: ReactNode;
  chips?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  className?: string;
  contentClassName?: string;
  summaryClassName?: string;
}

export function SurfaceHero({
  variant,
  eyebrow,
  badge,
  title,
  meta,
  body,
  summary,
  chips,
  actions,
  footer,
  aside,
  className,
  contentClassName,
  summaryClassName,
}: SurfaceHeroProps) {
  const theme = SURFACE_HERO_THEME[variant];

  return (
    <section
      className={cn("relative overflow-hidden rounded-[28px]", className)}
      style={{ background: theme.background }}
    >
      <div
        className={cn(
          "pointer-events-none absolute rounded-full bg-white/[0.02]",
          variant === "team"
            ? "-right-16 -top-16 h-[240px] w-[240px]"
            : "-right-20 -top-20 h-[280px] w-[280px]",
        )}
      />
      {variant === "team" ? (
        <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-[#d48e62]/12" />
      ) : null}

      {/* Mobil-karcsúsítás (UX-audit #9): kisebb padding és térközök < md —
          a hero ne egye meg az első képernyőt; a fülek/tartalom a hajtás
          közelébe kerül. Desktopon változatlan. */}
      <div className={cn("relative px-5 pb-5 pt-5 md:px-8 md:pb-8 md:pt-9", contentClassName)}>
        <div
          className={cn(
            "grid gap-6",
            aside ? "lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start" : undefined,
          )}
        >
          <div>
            {eyebrow || badge ? (
              <div className="flex flex-wrap items-center gap-2.5">
                {eyebrow ? eyebrow : null}
                {badge ? badge : null}
              </div>
            ) : null}

            <div className="mt-2 md:mt-3">{title}</div>
            {meta ? <div className="mt-1">{meta}</div> : null}
            {body ? <div className="mt-3">{body}</div> : null}
            {summary ? (
              <p
                className={cn(
                  "mt-2 max-w-[620px] text-[14px] leading-relaxed text-white/[0.42] md:mt-3",
                  summaryClassName,
                )}
              >
                {summary}
              </p>
            ) : null}
            {chips ? <div className="mt-4 flex flex-wrap gap-2 md:mt-5">{chips}</div> : null}
            {actions ? <div className="mt-4 flex flex-wrap gap-2 md:mt-6">{actions}</div> : null}
            {footer ? <div className="mt-2">{footer}</div> : null}
          </div>

          {aside ? (
            <aside className="hidden rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-[2px] lg:block">
              {aside}
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
