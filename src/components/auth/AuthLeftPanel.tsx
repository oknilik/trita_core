"use client";

export type AuthLeftPanelContext =
  | "explore"
  | "team"
  | "observer"
  | "signin"
  | "verify"
  | null;

interface AuthLeftPanelProps {
  context: AuthLeftPanelContext;
}

const CONTENT: Record<
  NonNullable<AuthLeftPanelContext>,
  {
    tag: string;
    title: React.ReactNode;
    valueItems?: string[];
    valueLabel?: string;
    subtitle?: string;
    stats?: { value: string; label: string }[];
  }
> = {
  explore: {
    tag: "önismeret",
    title: (
      <>
        Lásd tisztábban,{" "}
        <span className="text-[#e8a96a]">hogyan működsz.</span>
      </>
    ),
    subtitle: "Hat dimenzión keresztül, tudományos alapokon.",
    valueLabel: "Mit fogsz látni a végén?",
    valueItems: [
      "6 dimenziós személyiségprofil",
      "Erősségek és figyelendő területek",
      "Illeszkedő szerepkörök és karrierkép",
    ],
    stats: [
      { value: "6", label: "dimenzió" },
      { value: "~15", label: "perc" },
    ],
  },
  team: {
    tag: "csapatfejlesztés",
    title: (
      <>
        Értsd meg a csapatod{" "}
        <span className="text-[#e8a96a]">dinamikáját.</span>
      </>
    ),
    subtitle: "Adatvezérelt csapatépítés, személyiségprofil alapján.",
    valueLabel: "Mit kapsz?",
    valueItems: [
      "Csapat heatmap és dinamika",
      "Observer összehasonlítás",
      "Szerepillesztés és vakfoltok",
    ],
    stats: [
      { value: "14", label: "napos trial" },
      { value: "0", label: "kártyaadat" },
    ],
  },
  observer: {
    tag: "observer visszajelzés",
    title: (
      <>
        Adj visszajelzést —{" "}
        <span className="text-[#e8a96a]">névtelenül, őszintén.</span>
      </>
    ),
    subtitle: "Az observer értékelés segít a meghívónak megismerni, hogyan látják mások.",
  },
  signin: {
    tag: "üdv vissza",
    title: (
      <>
        Folytasd ott,{" "}
        <span className="text-[#e8a96a]">ahol abbahagytad.</span>
      </>
    ),
    subtitle: "Az eredményeid, visszajelzéseid és csapatod állapota várja.",
  },
  verify: {
    tag: "megerősítés",
    title: (
      <>
        Már majdnem{" "}
        <span className="text-[#e8a96a]">kész vagy.</span>
      </>
    ),
    subtitle: "Ellenőrizd az e-mail fiókodat és add meg a kódot.",
  },
};

export default function AuthLeftPanel({ context }: AuthLeftPanelProps) {
  const c = context ? CONTENT[context] : null;

  return (
    <div className="hidden w-[280px] shrink-0 flex-col justify-between bg-gradient-to-br from-[#1a1a2e] to-[#2a2740] px-8 py-10 lg:flex">
      <div>
        {c ? (
          <>
            {/* Tag */}
            <p className="mb-3 text-[9px] font-medium uppercase tracking-[2px] text-[#e8a96a]">
              {c.tag}
            </p>

            {/* Headline */}
            <h2 className="mb-2 font-fraunces text-[22px] leading-snug text-white">
              {c.title}
            </h2>

            {/* Subtitle */}
            {c.subtitle && (
              <p className="mb-6 text-[13px] leading-relaxed text-white/40">
                {c.subtitle}
              </p>
            )}

            {/* Value preview */}
            {c.valueLabel && c.valueItems && (
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3.5">
                <p className="mb-2.5 text-[9px] font-semibold uppercase tracking-[1.5px] text-white/30">
                  {c.valueLabel}
                </p>
                <ul className="space-y-2">
                  {c.valueItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12px] leading-snug text-white/60">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#e8a96a]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          /* No intent selected yet */
          <>
            <p className="mb-3 text-[9px] font-medium uppercase tracking-[2px] text-white/20">
              első lépés
            </p>
            <h2 className="mb-2 font-fraunces text-[22px] leading-snug text-white">
              Válaszd ki, mire{" "}
              <span className="text-[#e8a96a]">használnád.</span>
            </h2>
            <p className="text-[13px] leading-relaxed text-white/40">
              A választásod alapján személyre szabjuk a regisztrációt és az első lépéseket.
            </p>
          </>
        )}
      </div>

      {/* Bottom stats */}
      {c?.stats && (
        <div className="mt-8 flex gap-5 border-t border-white/[0.06] pt-5">
          {c.stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="font-fraunces text-2xl font-black text-[#e8a96a]">
                {s.value}
              </span>
              <span className="text-[11px] leading-snug text-white/30">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
