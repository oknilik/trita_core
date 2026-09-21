import { GLYPH_COLORS_CSS as colors } from "@/lib/type-glyph";

/** Decorative journey motifs, never a scored personality glyph. */
export function CandidateJourneyArtwork({ step }: { step: string }) {
  return (
    <svg
      viewBox="0 0 160 96"
      className="h-16 w-24 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      {step === "selfStep" ? (
        <>
          <path
            d="M70 14C46 36 39 52 45 68C51 85 84 85 92 67C100 49 85 29 70 14Z"
            fill={colors.form}
          />
          <path
            d="M60 51Q70 43 80 51M70 44V64"
            stroke={colors.line}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="118" cy="25" r="9" fill={colors.sun} />
          <path
            d="M24 81Q73 70 129 83"
            stroke={colors.line}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : step === "roleStep" ? (
        <>
          <path
            d="M37 66Q72 9 125 51M39 66Q82 92 125 51"
            stroke={colors.line}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="39" cy="66" r="14" fill={colors.counterweight} />
          <ellipse
            cx="81"
            cy="28"
            rx="16"
            ry="21"
            transform="rotate(20 81 28)"
            fill={colors.form}
          />
          <circle cx="124" cy="54" r="12" fill={colors.sun} />
          <path
            d="M75 62H89M82 55V69"
            stroke={colors.line}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M30 72V45C30 17 87 17 87 45V72H72V46C72 32 45 32 45 46V72Z"
            fill={colors.form}
          />
          <path
            d="M106 18V56M87 37H125M93 24L119 50M93 50L119 24"
            stroke={colors.line}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="119" cy="73" r="8" fill={colors.counterweight} />
          <path
            d="M26 83Q71 76 98 83"
            stroke={colors.line}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
