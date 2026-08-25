"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/client";

// Olvasási progress-bar a viewport tetején — halk, 3px, bronz gradiens.
// rAF-fal fojtott scroll-listener; a dokumentum teljes görgethető
// magasságához mér.
export function ReadingProgress({ slug }: { slug?: string }) {
  const [progress, setProgress] = useState(0);
  // P6: olvasási mélység — mérföldkövenként EGYSZER. A progress-bar úgyis
  // folyamatosan számol, ezért a mérés ingyen jár: nincs külön listener.
  const reachedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setProgress(ratio);

      if (!slug) return;
      for (const milestone of [25, 50, 75, 100] as const) {
        if (ratio * 100 < milestone || reachedRef.current.has(milestone)) continue;
        reachedRef.current.add(milestone);
        track("blog.read_progress", { slug, milestone });
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slug]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-[var(--color-border-default)]"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-primary-mid)]"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
