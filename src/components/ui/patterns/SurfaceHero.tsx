import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { LAYER_THEMES, layerHeroGradient, type LayerKey } from "@/lib/color-system";

export type SurfaceHeroVariant = LayerKey;

interface SurfaceHeroTheme {
  background: string;
  primary: string;
  badgeBg: string;
  badgeText: string;
}

// A réteg-témák egykapuja a color-system LAYER_THEMES — a hero, a loading-
// skeletonök és az eyebrow-k ugyanabból a térképből dolgoznak (2026-08).
// Jelölt-variáns: terrakotta/agyag — meleg, a bronz primary-val rokon, de
// jól elkülönül a self (zsálya) / team (szilva) / org (éjkék) hármastól.
export const SURFACE_HERO_THEME: Record<SurfaceHeroVariant, SurfaceHeroTheme> = {
  self: {
    background: layerHeroGradient("self"),
    primary: LAYER_THEMES.self.glow,
    badgeBg: LAYER_THEMES.self.badgeBg,
    badgeText: LAYER_THEMES.self.badgeText,
  },
  team: {
    background: layerHeroGradient("team"),
    primary: LAYER_THEMES.team.glow,
    badgeBg: LAYER_THEMES.team.badgeBg,
    badgeText: LAYER_THEMES.team.badgeText,
  },
  org: {
    background: layerHeroGradient("org"),
    primary: LAYER_THEMES.org.glow,
    badgeBg: LAYER_THEMES.org.badgeBg,
    badgeText: LAYER_THEMES.org.badgeText,
  },
  candidate: {
    background: layerHeroGradient("candidate"),
    primary: LAYER_THEMES.candidate.glow,
    badgeBg: LAYER_THEMES.candidate.badgeBg,
    badgeText: LAYER_THEMES.candidate.badgeText,
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
      // overflow-x-clip (nem hidden): a vízszintes kifutás továbbra is le van
      // vágva, de a heroból LEFELÉ nyíló panelek (pl. csapatváltó lenyíló)
      // nem csonkolódnak. A dekor-elemek saját clip-rétegben maradnak.
      className={cn("relative overflow-x-clip rounded-[28px]", className)}
      style={{ background: theme.background }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <div
          className={cn(
            "absolute rounded-full bg-white/[0.02]",
            variant === "team"
              ? "-right-16 -top-16 h-[240px] w-[240px]"
              : "-right-20 -top-20 h-[280px] w-[280px]",
          )}
        />
        {variant === "team" ? (
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-[var(--color-layer-team-glow)]/12" />
        ) : null}
      </div>

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
