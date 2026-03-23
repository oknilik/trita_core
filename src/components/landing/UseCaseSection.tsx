import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";

interface UseCase {
  label: string;
  title: string;
  desc: string;
  outcome: string;
  icon: ReactNode;
}

const icons: ReactNode[] = [
  (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="10" r="5" stroke="#c17f4a" strokeWidth="1.5" />
      <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#c17f4a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 8l2 2 4-4" stroke="#3d6b5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="10" cy="16" r="5" stroke="#c17f4a" strokeWidth="1.5" />
      <circle cx="22" cy="16" r="5" stroke="#c17f4a" strokeWidth="1.5" />
      <path d="M15 16h2" stroke="#c17f4a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 8V6M22 8V6" stroke="#3d6b5e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="8" height="8" rx="1" stroke="#c17f4a" strokeWidth="1.5" />
      <rect x="18" y="6" width="8" height="8" rx="1" stroke="#c17f4a" strokeWidth="1.5" />
      <rect x="6" y="18" width="8" height="8" rx="1" stroke="#c17f4a" strokeWidth="1.5" />
      <rect x="18" y="18" width="8" height="8" rx="1" stroke="#3d6b5e" strokeWidth="1.5" />
      <path d="M10 14v4M22 14v4M14 10h4M14 22h4" stroke="#c17f4a" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
];

const useCasesData: Record<Locale, Array<Omit<UseCase, "icon">>> = {
  hu: [
    {
      label: "01 — Felvétel",
      title: "Új kolléga felvétele",
      desc: "Látod, hogyan illeszkedik a jelölt személyisége és munkastílusa a meglévő csapat dinamikájába – mielőtt aláírjátok a szerződést. Nem csak megérzésből, adatokból.",
      outcome: "Csökkenti a rossz felvétel kockázatát",
    },
    {
      label: "02 — Konfliktus",
      title: "Csapatfeszültség feltárása",
      desc: "Nem kell pszichológusnak lenni ahhoz, hogy megértsd, miért nem működik két ember együtt. A trita lefordítja, amit eddig csak éreztél, és segít a megoldásban.",
      outcome: "Láthatóvá teszi a rejtett mintákat",
    },
    {
      label: "03 — Fejlesztés",
      title: "Csapatszerepek tisztázása",
      desc: "Ki dolgozik jól stressz alatt? Ki van rossz szerepben? Az observer visszajelzés és az önkép különbsége megmutatja, hol lehet érdemes változtatni.",
      outcome: "Jobb szerepkiosztás, kevesebb lemorzsolódás",
    },
  ],
  en: [
    {
      label: "01 — Hiring",
      title: "Hiring a new colleague",
      desc: "See how the candidate's personality and work style fits the existing team dynamics — before you sign the contract. Not from gut feeling, from data.",
      outcome: "Reduces bad hire risk",
    },
    {
      label: "02 — Conflict",
      title: "Uncovering team tension",
      desc: "You don't need to be a psychologist to understand why two people can't work together. trita translates what you only felt before, and helps find the solution.",
      outcome: "Makes hidden patterns visible",
    },
    {
      label: "03 — Development",
      title: "Clarifying team roles",
      desc: "Who works well under pressure? Who's in the wrong role? The gap between observer feedback and self-image shows where change might be worth making.",
      outcome: "Better role fit, less churn",
    },
  ],
};

const sectionCopyData: Record<Locale, { eyebrow: string; heading: string }> = {
  hu: {
    eyebrow: "Mire használják a csapatok",
    heading: "Három helyzet,\nahol a trita számít.",
  },
  en: {
    eyebrow: "How teams use it",
    heading: "Three situations\nwhere trita makes a difference.",
  },
};

export function UseCaseSection({ locale }: { locale: Locale }) {
  const useCasesText = useCasesData[locale] ?? useCasesData.hu;
  const sectionCopy = sectionCopyData[locale] ?? sectionCopyData.hu;

  const useCases: UseCase[] = useCasesText.map((item, i) => ({
    ...item,
    icon: icons[i],
  }));

  const [headingLine1, headingLine2] = sectionCopy.heading.split("\n");

  return (
    <section className="border-b border-sand px-6 py-12 md:px-16 md:py-20">
      <div className="mb-12">
        <div className="font-dm-sans mb-3 text-[11px] uppercase tracking-[2px] text-ink-body">
          {sectionCopy.eyebrow}
        </div>
        <h2 className="font-fraunces text-[clamp(28px,7vw,40px)] font-black leading-[1.1] tracking-[-1px] text-ink md:tracking-[-1.5px]">
          {headingLine1}
          <br />
          {headingLine2}
        </h2>
      </div>

      <div className="overflow-hidden rounded-md border border-sand bg-sand">
        <div className="grid grid-cols-1 gap-[2px] md:grid-cols-3">
          {useCases.map((item) => (
            <article key={item.label} className="group relative bg-cream px-8 py-9 transition-colors hover:bg-white">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-sage opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-5">{item.icon}</div>
              <p className="font-dm-sans mb-2 text-[10px] uppercase tracking-[2px] text-ink-body">{item.label}</p>
              <h3 className="font-fraunces mb-3 text-[22px] leading-[1.2] font-bold text-ink">{item.title}</h3>
              <p className="mb-5 text-sm leading-[1.7] font-light text-ink-body">{item.desc}</p>
              <p className="font-dm-sans flex items-center gap-1.5 border-t border-sand pt-4 text-xs text-sage">
                <span>→</span>
                {item.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
