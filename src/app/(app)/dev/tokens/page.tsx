import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Token-galéria — FEJLESZTŐI felület, élesben nem létezik.
//
// Két dolgot szolgál:
//  1. Referencia: egy helyen látszik a teljes szerep-token készlet, mindkét
//     színsémán. Új token felvételekor ide is kerüljön be.
//  2. A képi regressziós háló célpontja
//     (tests/e2e/visual/theme-gallery.spec.ts). Azért EZ a lap, és nem egy
//     valódi app-oldal: itt nincs adat, dátum, animáció és véletlen — a
//     baseline stabil marad, és ami eltér, az tényleg a design-rendszer
//     változása.
//
// A lap az (app) fában van, tehát megkapja a `.theme-scope` hatókört —
// pontosan azt a környezetet, amit a sötét mód érint.
//
// MIÉRT INLINE STÍLUS a Tailwind arbitrary osztály helyett: a Tailwind
// STATIKUSAN pásztázza a forrást, tehát a `bg-[var(--color-${x})]` alakú
// interpolált osztályt nem látja. Ilyenkor a minta némán színtelen marad —
// pontosan ott, ahol a galéria dolga a hiány kimutatása. Az inline stílus
// scanner-független.

// Az (app) shell requestenként dinamikus (auth + nav-kontextus), ezért ez a
// lap sem lehet statikus — statikus renderelésnél nincs kérés, és a Clerk
// auth() middleware nélkül hibázna.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Token-galéria | trita dev",
  robots: { index: false, follow: false },
};

const SURFACES = [
  "surface-canvas",
  "surface-card",
  "surface-muted",
  "cream-300",
];
const TEXTS = ["text-primary", "text-secondary", "text-muted", "text-faint"];
const DIMS = [
  ["h", "Becsületesség-Alázat"],
  ["e", "Emocionalitás"],
  ["x", "Extraverzió"],
  ["a", "Barátságosság"],
  ["c", "Lelkiismeretesség"],
  ["o", "Nyitottság"],
] as const;
const STATES = ["success", "warning", "error", "info"] as const;
const EVALS = ["high", "mid", "low"] as const;
const ROLES = ["thinking", "action", "people"] as const;
const LAYERS = ["self", "team", "org", "candidate"] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2
        className="text-label uppercase"
        style={{ color: "var(--color-text-muted)" }}
      >
        {title}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

const v = (token: string) => `var(--color-${token})`;

function Swatch({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <div
      className="flex min-h-[64px] w-[190px] flex-col justify-center rounded-lg border px-3 py-2"
      style={{
        background: v(bg),
        color: v(fg),
        borderColor: v("border-default"),
      }}
    >
      <span className="text-caption font-semibold">{label}</span>
    </div>
  );
}

export default function TokenGalleryPage() {
  // Élesben nincs ilyen útvonal — a lap csak fejlesztéshez és teszthez van.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
        trita · fejlesztői
      </p>
      <h1 className="mt-2 font-fraunces text-title text-[var(--color-text-primary)]">
        Token-galéria
      </h1>
      <p className="mt-2 max-w-2xl text-body text-[var(--color-text-secondary)]">
        A szerep-token készlet mindkét színsémán. Ez a lap a képi regressziós
        háló célpontja — szándékosan nincs benne adat, dátum és animáció.
      </p>

      <Section title="Felület × szöveg">
        {SURFACES.map((surface) => (
          <div
            key={surface}
            className="w-[230px] rounded-xl border p-3"
            style={{ background: v(surface), borderColor: v("border-default") }}
          >
            <p
              className="text-label uppercase"
              style={{ color: v("text-muted") }}
            >
              {surface}
            </p>
            {TEXTS.map((text) => (
              <p
                key={text}
                className="mt-1 text-caption"
                style={{ color: v(text) }}
              >
                {text}
              </p>
            ))}
          </div>
        ))}
      </Section>

      <Section title="Gombok">
        <button
          className="min-h-[44px] rounded-lg px-5 text-caption font-semibold"
          style={{
            background: v("action-primary-bg"),
            color: v("action-primary-fg"),
          }}
        >
          Elsődleges
        </button>
        <button
          className="min-h-[44px] rounded-lg border px-5 text-caption font-semibold"
          style={{
            background: v("action-secondary-bg"),
            color: v("action-secondary-fg"),
            borderColor: v("action-secondary-border"),
          }}
        >
          Másodlagos
        </button>
        <button
          className="min-h-[44px] rounded-lg px-5 text-caption font-semibold"
          style={{
            background: v("action-destructive-bg"),
            color: v("action-destructive-fg"),
          }}
        >
          Destruktív
        </button>
        <button
          disabled
          className="min-h-[44px] rounded-lg border px-5 text-caption font-semibold"
          style={{
            background: v("state-disabled-bg"),
            color: v("state-disabled-fg"),
            borderColor: v("state-disabled-border"),
          }}
        >
          Letiltott
        </button>
      </Section>

      <Section title="Dimenziók">
        {DIMS.map(([code, label]) => (
          <div
            key={code}
            className="flex w-[230px] items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: v(`dim-${code}-soft`) }}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: v(`dim-${code}-base`) }}
            />
            <span
              className="text-caption font-semibold"
              style={{ color: v(`dim-${code}-strong`) }}
            >
              {label}
            </span>
          </div>
        ))}
      </Section>

      <Section title="Státusz">
        {STATES.map((state) => (
          <div
            key={state}
            className="w-[190px] rounded-lg border px-3 py-2"
            style={{
              background: v(`state-${state}-bg`),
              borderColor: v(`state-${state}-border`),
            }}
          >
            <span
              className="text-caption font-semibold"
              style={{ color: v(`state-${state}-fg`) }}
            >
              {state}
            </span>
            <span
              className="ml-2 inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: v(`state-${state}-solid`) }}
            />
          </div>
        ))}
      </Section>

      <Section title="Értékelő rampa">
        {EVALS.map((level) => (
          <Swatch
            key={level}
            label={`eval ${level}`}
            bg={`eval-${level}-bg`}
            fg={`eval-${level}-fg`}
          />
        ))}
      </Section>

      <Section title="Csapatszerep-családok">
        {ROLES.map((family) => (
          <Swatch
            key={family}
            label={family}
            bg={`role-${family}-bg`}
            fg={`role-${family}-fg`}
          />
        ))}
      </Section>

      <Section title="Réteg-tintek">
        {LAYERS.map((layer) => (
          <Swatch
            key={layer}
            label={`layer ${layer}`}
            bg={`layer-${layer}-soft`}
            fg="text-primary"
          />
        ))}
      </Section>

      <Section title="Réteg-herók">
        {LAYERS.map((layer) => (
          <div
            key={layer}
            className="w-[230px] rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, var(--color-layer-${layer}-hero-from), var(--color-layer-${layer}-hero-mid), var(--color-layer-${layer}-hero-to))`,
            }}
          >
            <p
              className="text-label uppercase"
              style={{ color: v(`layer-${layer}-badge`) }}
            >
              {layer}
            </p>
            <p className="mt-1 font-fraunces text-heading text-white">Hero</p>
          </div>
        ))}
      </Section>

      <Section title="Akcentek és keretek">
        <Swatch
          label="accent-primary-strong"
          bg="surface-card"
          fg="accent-primary-strong"
        />
        <Swatch
          label="accent-self-deep"
          bg="surface-card"
          fg="accent-self-deep"
        />
        <Swatch
          label="accent-candidate"
          bg="accent-candidate-soft"
          fg="accent-candidate"
        />
        <Swatch label="border-strong" bg="surface-card" fg="text-secondary" />
      </Section>
    </main>
  );
}
