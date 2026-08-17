interface TritaLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

interface TritaWordmarkProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Egyszínű trita szójel egyetlen bronz akcentussal az i pontján.
 *
 * A dotless-i külön elem, így a pont színe önálló marad anélkül, hogy az
 * egész betűt ki kellene emelni. A feliratot egyetlen accessible névként
 * adjuk át, ezért a vizuális betűelemeket a felolvasók nem betűzik külön.
 */
export function TritaWordmark({ className = "", style }: TritaWordmarkProps) {
  return (
    <span
      className={`inline-flex items-baseline font-fraunces font-black leading-none tracking-[-0.03em] ${className}`}
      style={style}
      aria-label="trita"
    >
      <span aria-hidden="true" className="inline-flex items-baseline">
        tr
        <span className="relative inline-block">ı
          <span className="absolute left-1/2 top-[-0.045em] size-[0.22em] min-h-px min-w-px -translate-x-1/2 rounded-full bg-[var(--color-accent-primary-strong)]" />
        </span>
        ta
      </span>
    </span>
  );
}

export function TritaLogo({
  size = 80,
  showText = true,
  className = "",
}: TritaLogoProps) {
  const fontSize = Math.max(16, Math.round(size * 0.5));
  const taglineSize = Math.max(9, Math.round(fontSize * 0.28));

  return (
    <div className={`inline-flex flex-col items-center leading-none ${className}`}>
      <TritaWordmark
        className="text-[var(--color-text-primary)]"
        style={{ fontSize }}
      />
      {showText ? (
        <span
          className="font-dm-sans mt-1 tracking-widest uppercase text-ink-body"
          style={{ fontSize: taglineSize }}
        >
          team intelligence
        </span>
      ) : null}
    </div>
  );
}
