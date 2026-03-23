import Link from "next/link";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

const copy = {
  self: {
    titleBefore: "Fedezd fel a",
    titleEm: "karrierprofilod",
    sub: "12 perc — ennyi kell, hogy megtudd, milyen karrierre vagy teremtve. Tudományosan validált, azonnal elérhető.",
    cta: "Ingyenes teszt indítása →",
    ctaHref: "/sign-up",
    note: "Ingyenes · Nem kell bankkártya · Azonnali eredmény",
  },
  team: {
    titleBefore: "Érted meg a",
    titleEm: "csapatod",
    sub: "A trita megmutatja a csapatod valódi dinamikáját — mielőtt a feszültség konfliktussá válik.",
    cta: "Csapat elemzés indítása →",
    ctaHref: "/sign-up?type=team",
    note: "€49/hó · Founding program: személyes onboarding",
  },
};

export function CtaSection({ mode }: { mode: SiteMode }) {
  const c = copy[mode];
  const isSelf = mode === "self";

  return (
    <section className="py-12 px-7">
      <div className="mx-auto max-w-[640px] text-center">
        <p className="mb-3 font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-bronze">
          KÉSZEN ÁLLSZ?
        </p>
        <h2 className="font-fraunces mb-5 text-[clamp(28px,3.5vw,42px)] font-normal leading-[1.1] tracking-tight text-ink">
          {c.titleBefore}{" "}
          <em className="not-italic italic text-sage">{c.titleEm}</em>
        </h2>
        <p className="mb-9 text-base leading-relaxed text-ink-body">{c.sub}</p>
        <Link
          href={c.ctaHref}
          className={[
            "inline-flex min-h-[54px] items-center justify-center rounded-[14px] px-9 text-[17px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg",
            isSelf ? "bg-[#c17f4a] hover:bg-[#9a6538]" : "bg-[#3d6b5e] hover:bg-[#2d5a4e]",
          ].join(" ")}
        >
          {c.cta}
        </Link>
        <p className="mt-3.5 font-dm-sans text-xs text-ink-body/60">{c.note}</p>
      </div>
    </section>
  );
}
