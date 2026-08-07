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
        <span className="text-[var(--color-accent-primary-soft)]">hogyan működsz.</span>
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
      { value: "~10", label: "perc" },
    ],
  },
  team: {
    tag: "csapatfejlesztés",
    title: (
      <>
        Értsd meg a csapatod{" "}
        <span className="text-[var(--color-accent-primary-soft)]">dinamikáját.</span>
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
      { value: "14", label: "nap próbaidő" },
      { value: "0", label: "kártyaadat" },
    ],
  },
  observer: {
    tag: "observer visszajelzés",
    title: (
      <>
        Adj visszajelzést —{" "}
        <span className="text-[var(--color-accent-primary-soft)]">névtelenül, őszintén.</span>
      </>
    ),
    subtitle: "Az observer értékelés segít a meghívónak megismerni, hogyan látják mások.",
  },
  signin: {
    tag: "örülünk, hogy újra itt vagy",
    title: (
      <>
        Folytasd ott,{" "}
        <span className="text-[var(--color-accent-primary-soft)]">ahol abbahagytad.</span>
      </>
    ),
    subtitle: "Az eredményeid, visszajelzéseid és csapatod állapota várja.",
  },
  verify: {
    tag: "megerősítés",
    title: (
      <>
        Már majdnem{" "}
        <span className="text-[var(--color-accent-primary-soft)]">kész vagy.</span>
      </>
    ),
    subtitle: "Ellenőrizd az e-mail fiókodat és add meg a kódot.",
  },
};

export default function AuthLeftPanel({ context }: AuthLeftPanelProps) {
  const c = context ? CONTENT[context] : null;

  return (
    <div className="hidden w-[280px] shrink-0 flex-col justify-between bg-gradient-to-br from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] px-8 py-10 lg:flex">
      <div>
        {c ? (
          <>
            {/* Tag */}
            <p className="mb-3 text-micro font-medium uppercase tracking-widest text-[var(--color-accent-primary-soft)]">
              {c.tag}
            </p>

            {/* Headline */}
            <h2 className="mb-2 font-fraunces text-[22px] leading-snug text-white">
              {c.title}
            </h2>

            {/* Subtitle */}
            {c.subtitle && (
              <p className="mb-6 text-caption leading-relaxed text-white/40">
                {c.subtitle}
              </p>
            )}

            {/* Value preview */}
            {c.valueLabel && c.valueItems && (
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3.5">
                <p className="mb-2.5 text-micro font-semibold uppercase tracking-widest text-white/30">
                  {c.valueLabel}
                </p>
                <ul className="space-y-2">
                  {c.valueItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12px] leading-snug text-white/60">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent-primary-soft)]" />
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
            <p className="mb-3 text-micro font-medium uppercase tracking-widest text-white/20">
              első lépés
            </p>
            <h2 className="mb-2 font-fraunces text-[22px] leading-snug text-white">
              Válaszd ki, mire{" "}
              <span className="text-[var(--color-accent-primary-soft)]">használnád.</span>
            </h2>
            <p className="text-caption leading-relaxed text-white/40">
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
              <span className="font-fraunces text-2xl font-black text-[var(--color-accent-primary-soft)]">
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
