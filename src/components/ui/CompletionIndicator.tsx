import { ProgressRing } from "@/components/ui/ProgressRing";

// Készültség-kijelző a hero-pillanatképekhez (UX-audit #5): részleges
// értéknél a megszokott gyűrű; 100%-nál viszont nem „még egy kör", hanem
// kompakt pipa-jelvény — a kész állapot ne kapjon annyi vizuális súlyt,
// mint a folyamatban lévő. A külső doboz ettől még a gyűrűvel azonos magas,
// így a pillanatkép-kártyák alatta lévő feliratai egy vonalban maradnak.
export function CompletionIndicator({
  percent,
  size = 76,
  color,
}: {
  percent: number;
  size?: number;
  color: string;
}) {
  if (percent < 100) {
    return (
      <ProgressRing percent={percent} size={size} label={`${percent}%`} color={color} />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <svg
          viewBox="0 0 16 16"
          className="h-4.5 w-4.5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 8.5l3.5 3.5L13 5" />
        </svg>
      </span>
    </span>
  );
}
