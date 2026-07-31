import { FORM_GEOMETRY } from "@/lib/type-glyph";

// Hero-grafika: a Nyitottság motívuma (szem + spirál) — a típusábrák
// nyelvtanából, nem új illusztráció.
//
// Teljes kontraszttal, terrakottában: a korábbi ~20%-os opacitású, a
// képszélen kifutó iránytű díszítés volt, nem állítás. Egy markáns forma
// többet mond, mint egy halvány háttérkép.

const EYE = FORM_GEOMETRY.eye;

/** A spirál a szem közepébe horgonyzódik, a nyelvtan szerinti arányban. */
function spiralPath(cx: number, cy: number, scale: number): string {
  const s = (value: number) => value * scale;
  return [
    `M ${cx - s(8)} ${cy}`,
    `a ${s(8)},${s(8)} 0 0 1 ${s(16)},0`,
    `a ${s(16)},${s(16)} 0 0 1 ${-s(32)},0`,
    `a ${s(24)},${s(24)} 0 0 1 ${s(48)},0`,
    `a ${s(32)},${s(32)} 0 0 1 ${-s(64)},0`,
  ].join(" ");
}

export function FakeDoorArt({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="300 250 340 356"
      className={className}
      role="presentation"
      aria-hidden
    >
      <path d={EYE.path} fill="var(--fd-terracotta)" />
      <path
        d={spiralPath(EYE.anchor.x, EYE.anchor.y, 1.15)}
        fill="none"
        stroke="var(--fd-cream)"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle
        cx={EYE.accent && "x" in EYE.accent ? EYE.accent.x : EYE.anchor.x}
        cy={EYE.accent && "y" in EYE.accent ? EYE.accent.y : EYE.anchor.y}
        r={11}
        fill="var(--fd-mustard)"
      />
    </svg>
  );
}
