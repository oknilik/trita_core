// „Kapcsolódó pályák” — a /about állításblokk Miró ihletésű, fixen
// komponált motívuma. A metsződő, kézírásos ívek és a három pont a különálló
// mozgásokból kirajzolódó közös mintázatot idézik. Dekoráció — aria-hidden.

const ACCENT = "var(--color-accent-primary)";
const ACCENT_STRONG = "var(--color-accent-primary-strong)";
const ON_INVERSE = "var(--color-text-on-inverse)";
const INVERSE_SOFT = "var(--color-surface-inverse-soft)";

export function AboutStatementArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 320"
      className={className}
      aria-hidden
      focusable="false"
      style={{ display: "block", height: "auto" }}
    >
      <path
        d="M 54 164 C 27 99, 62 39, 139 30 C 220 21, 284 77, 279 158 C 274 239, 213 282, 135 270 C 58 258, 21 210, 54 164 Z"
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 111 75 C 169 28, 257 38, 298 108 C 341 182, 304 266, 222 296 C 143 325, 75 282, 68 207 C 62 148, 79 101, 111 75 Z"
        fill="none"
        stroke={ACCENT_STRONG}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 38 255 C 105 229, 165 192, 216 146 C 257 109, 286 82, 316 69"
        fill="none"
        stroke={INVERSE_SOFT}
        strokeWidth={2.2}
        strokeLinecap="round"
      />

      <g>
        <circle cx={91} cy={91} r={12} fill={ACCENT} />
        <circle cx={91} cy={91} r={20} fill="none" stroke={ACCENT_STRONG} strokeWidth={6} />
        <circle cx={283} cy={233} r={12} fill={ACCENT} />
        <circle cx={283} cy={233} r={20} fill="none" stroke={ACCENT_STRONG} strokeWidth={6} />
        <circle cx={204} cy={143} r={6} fill={ON_INVERSE} />
      </g>

      <path
        d="M 185 188 C 192 176, 204 176, 210 187 C 221 189, 226 197, 218 205 C 205 212, 191 211, 181 203 C 177 197, 179 192, 185 188 Z"
        fill={ACCENT}
      />

      <circle cx={318} cy={52} r={4.5} fill={ON_INVERSE} />
      <circle cx={45} cy={287} r={4.5} fill={ACCENT} />
      <path d="M 315 136 L 337 126" fill="none" stroke={ACCENT} strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}
