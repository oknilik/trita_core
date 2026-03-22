"use client";

export type AuthLeftPanelContext =
  | "explore"
  | "team"
  | "observer"
  | "signin"
  | "verify";

interface AuthLeftPanelProps {
  context: AuthLeftPanelContext;
}

const CONTENT: Record<
  AuthLeftPanelContext,
  {
    tag: string;
    title: React.ReactNode;
    quote: string;
    quoteAuthor: string;
    stats?: { value: string; label: string }[];
  }
> = {
  explore: {
    tag: "// önismeret",
    title: (
      <>
        Ismerd meg magad –{" "}
        <span className="text-[#c8410a]">tudományos alapon.</span>
      </>
    ),
    quote:
      "Hat dimenzión keresztül láthatóvá válik, hogyan gondolkodsz, hogyan viszonyulsz másokhoz – és mi mozgat belülről.",
    quoteAuthor: "trita",
    stats: [
      { value: "6", label: "személyiségdimenzió" },
      { value: "~15", label: "perces teszt" },
    ],
  },
  team: {
    tag: "// csapatfejlesztés",
    title: (
      <>
        Értsd meg a csapatod –{" "}
        <span className="text-[#c8410a]">adatvezérelt módon.</span>
      </>
    ),
    quote:
      "Heatmap, dinamika-elemzés, observer összehasonlítás – minden ami kell ahhoz, hogy a csapatod valóban együttműködjön.",
    quoteAuthor: "trita",
    stats: [
      { value: "14", label: "napos ingyenes trial" },
      { value: "0", label: "kártyaadat szükséges" },
    ],
  },
  observer: {
    tag: "// observer visszajelzés",
    title: (
      <>
        Adj visszajelzést –{" "}
        <span className="text-[#c8410a]">névtelenül és őszintén.</span>
      </>
    ),
    quote:
      "Az observer értékelés segít a meghívónak megismerni, hogyan látják mások – nem ítélet, hanem tükör.",
    quoteAuthor: "trita",
  },
  signin: {
    tag: "// üdv vissza",
    title: (
      <>
        Folytasd ott,{" "}
        <span className="text-[#c8410a]">ahol abbahagytad.</span>
      </>
    ),
    quote:
      "A trita megjegyzi az eredményeidet, az observer visszajelzéseidet és a csapatod állapotát.",
    quoteAuthor: "trita",
  },
  verify: {
    tag: "// megerősítés",
    title: (
      <>
        Már majdnem{" "}
        <span className="text-[#c8410a]">kész vagy.</span>
      </>
    ),
    quote: "Ellenőrizd az e-mail fiókodat és add meg a kódot a folytatáshoz.",
    quoteAuthor: "trita",
  },
};

export default function AuthLeftPanel({ context }: AuthLeftPanelProps) {
  const content = CONTENT[context];

  return (
    <div className="hidden w-[260px] shrink-0 flex-col justify-between bg-[#1a1814] px-8 py-10 lg:flex">
      <div>
        <p className="font-ibm-plex-mono mb-6 text-[10px] uppercase tracking-[2px] text-[#c8410a]">
          trita
        </p>

        <p className="font-ibm-plex-mono mb-3 text-[10px] uppercase tracking-[1.5px] text-[#faf9f6]/40">
          {content.tag}
        </p>

        <h2 className="font-playfair mb-6 text-[22px] leading-snug text-[#faf9f6]">
          {content.title}
        </h2>

        <div className="rounded-lg border border-[#faf9f6]/10 bg-[#faf9f6]/5 px-4 py-3">
          <p className="text-[13px] leading-[1.7] text-[#faf9f6]/70">
            &ldquo;{content.quote}&rdquo;
          </p>
          <p className="mt-2 font-ibm-plex-mono text-[10px] uppercase tracking-[1px] text-[#faf9f6]/30">
            — {content.quoteAuthor}
          </p>
        </div>
      </div>

      {content.stats && (
        <div className="flex gap-4">
          {content.stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="font-playfair text-2xl font-black text-[#c8410a]">
                {s.value}
              </span>
              <span className="text-[11px] leading-snug text-[#faf9f6]/40">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
