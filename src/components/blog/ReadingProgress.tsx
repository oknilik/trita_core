"use client";

import { useEffect, useState } from "react";

// Olvasási progress-bar a cikk tetején — halk, 3px, bronz gradiens.
// rAF-fal fojtott scroll-listener; a dokumentum teljes görgethető
// magasságához mér.
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
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
  }, []);

  return (
    <div
      aria-hidden
      className="sticky top-0 z-40 h-[3px] w-full bg-[var(--color-border-default)]"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-primary-mid)]"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
