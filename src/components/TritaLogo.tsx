interface TritaLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
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
      <span
        className="inline-flex items-baseline font-fraunces font-black tracking-[-0.03em] text-ink"
        style={{ fontSize }}
        aria-label="trita"
      >
        {"trit"}<span className="text-bronze">a</span>
      </span>
      {showText ? (
        <span
          className="font-dm-sans mt-1 tracking-[0.16em] uppercase text-ink-body"
          style={{ fontSize: taglineSize }}
        >
          team intelligence
        </span>
      ) : null}
    </div>
  );
}
