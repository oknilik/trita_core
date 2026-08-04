"use client";

// Kis emoji-beszúró sor a visszajelzés-szerkesztőkhöz (peer feedback).
// Kattintásra a szöveg végéhez fűzi az emojit — nincs külső picker-függőség.

const EMOJIS = ["🙌", "👏", "🙏", "🚀", "💡", "❤️", "🎯", "✨", "💪", "🌱"] as const;

export function EmojiRow({
  onPick,
  className,
}: {
  onPick: (emoji: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`} aria-hidden>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          tabIndex={-1}
          onClick={() => onPick(emoji)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-body transition hover:bg-cream"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

/** A kudos-jelvényként választható emojik (API-allowlist is ebből él). */
export const KUDOS_BADGES = ["🙌", "👏", "🙏", "🚀", "💡", "❤️", "🎯", "🏆"] as const;
export type KudosBadge = (typeof KUDOS_BADGES)[number];
