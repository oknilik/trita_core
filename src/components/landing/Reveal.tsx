"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Lépcsőzés másodpercben (a korábbi framer `transition.delay` megfelelője). */
  delay?: number;
}

/**
 * Hajtás alatti beúszás — a framer-motion `whileInView` + `viewport once`
 * minta CSS-változata.
 *
 * Miért: a framer-motion a landing egyik legnagyobb JS-tétele, és minden
 * ilyen blokk egy React-vezérelt animációt futtatott. Ugyanez
 * IntersectionObserverrel + egy CSS-keyframe-mel ugyanúgy néz ki
 * (0.5s, y:20px, cubic-bezier(0.16,1,0.3,1)), de nem terheli a fő szálat.
 *
 * Robusztusság: a REJTETT állapotot (`.reveal-armed`) JS teszi rá, a szerver-
 * HTML látható. Ha nincs JS / IntersectionObserver / a CSS nem tölt be, a
 * tartalom akkor is olvasható marad. Ami betöltéskor már a nézetben van, azt
 * meg sem próbáljuk elrejteni (nem villan), és `prefers-reduced-motion`
 * esetén sincs mozgás.
 */
export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Már látható elem: marad, ahogy a szerver-HTML-ből jött.
    if (el.getBoundingClientRect().top < window.innerHeight - 50) return;

    el.classList.add("reveal-armed");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.classList.remove("reveal-armed");
          el.classList.add("animate-rise-in");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
