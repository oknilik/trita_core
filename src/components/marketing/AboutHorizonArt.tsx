// „Horizont” — kézzel komponált szerkesztői illusztráció a /about hero alá.
//
// A formanyelv 2. szintjének készletéből dolgozik (talajvonal, nap, csillag,
// ellensúly, hullám-arcs, pontsor), de NEM generált: a Rólunk oldal egyetlen
// nagy felületén a véletlen konstelláció helyett egy fixen komponált, nyugodt
// tájkép áll. A színek a miro-primitives palettáját követik token-szinten,
// így mindkét színsémán helyes. Dekoráció — aria-hidden, nincs kliens-állapot.

const LINE = "var(--color-text-primary)";
const SUN = "var(--color-accent-primary-soft)";
const COUNTERWEIGHT = "var(--color-action-primary-bg)";
const DOTS = "var(--color-accent-primary)";

export function AboutHorizonArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 190"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-hidden
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* Talajvonal — enyhén hullámzó kézírás-ív, nem vízszintes egyenes. */}
      <path
        d="M 30 128 C 220 116, 420 138, 620 124 C 740 116, 820 126, 872 120"
        fill="none"
        stroke={LINE}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Félig felkelt nap a vonal mögül. */}
      <path d="M 560 126 A 46 46 0 0 1 652 126 Z" fill={SUN} />
      {/* Csillag a horizont fölött. */}
      <g stroke={LINE} strokeWidth={3} strokeLinecap="round" opacity={0.9}>
        <line x1={230} y1={42} x2={230} y2={106} />
        <line x1={198} y1={74} x2={262} y2={74} />
        <line x1={208} y1={52} x2={252} y2={96} />
        <line x1={252} y1={52} x2={208} y2={96} />
      </g>
      {/* Ellensúly a vonalon ülve. */}
      <circle cx={410} cy={112} r={12} fill={COUNTERWEIGHT} />
      {/* Hullám-jel a jobb oldalon. */}
      <path
        d="M 760 78 q 13 -16 27 -4 q 13 -16 27 -4"
        fill="none"
        stroke={LINE}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Pontsor-ritmus a vonal alatt. */}
      <g fill={DOTS}>
        <circle cx={80} cy={156} r={4} />
        <circle cx={108} cy={156} r={4} />
        <circle cx={136} cy={156} r={4} />
      </g>
    </svg>
  );
}
