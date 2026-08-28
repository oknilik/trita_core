"use client";

import { useEffect, useState } from "react";

export interface TocHeading {
  id: string;
  text: string;
}

// Tartalomjegyzék a cikk h2-iből: desktopon sticky oldalsáv (a szülő
// pozicionálja), mobilon összecsukható <details>. IntersectionObserver
// jelöli az aktív szakaszt; alul „még ~X perc" becslés a scroll-arányból.
export function ArticleToc({
  headings,
  totalMinutes,
  labels,
  variant = "desktop",
}: {
  headings: TocHeading[];
  totalMinutes: number;
  labels: { inThisArticle: string; minutesLeft: string /* "{m}" placeholderrel */ };
  /** mobile: összecsukható details a cikk-hasábban · desktop: kártya az oldalsávban */
  variant?: "mobile" | "desktop";
}) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);
  const [minutesLeft, setMinutesLeft] = useState(totalMinutes);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setMinutesLeft(Math.max(0, Math.ceil(totalMinutes * (1 - p))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [totalMinutes]);

  if (headings.length < 2) return null;

  const list = (
    <nav>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`block border-l-2 py-1.5 pl-3 text-caption no-underline transition-colors ${
            activeId === h.id
              ? "border-[var(--color-action-primary-bg)] font-semibold text-[var(--color-accent-self-deep)]"
              : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-accent-self-deep)]"
          }`}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );

  const minutesLine = (
    <p className="mt-3 px-1 text-micro text-[var(--color-text-muted)]">
      {labels.minutesLeft.replace("{m}", String(minutesLeft))}
    </p>
  );

  if (variant === "mobile") {
    return (
      <details className="mb-7 rounded-[20px] border border-sand bg-surface-card shadow-[0_10px_28px_rgba(26,26,46,0.03)] md:hidden">
        {/* A padding a summary-n van, hogy a teljes kártyafelület legyen a
            toggle érintőcélja (min. 44px) – nem csak a szövegsor */}
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center px-5 py-3.5 text-caption font-semibold text-ink">
          {labels.inThisArticle}
        </summary>
        <div className="px-5 pb-3.5">{list}</div>
      </details>
    );
  }

  return (
    <div className="rounded-[20px] border border-sand bg-surface-card px-5 py-5 shadow-[0_12px_32px_rgba(26,26,46,0.035)]">
      <p className="mb-3 text-caption font-semibold text-ink">
        {labels.inThisArticle}
      </p>
      {list}
      {minutesLine}
    </div>
  );
}
