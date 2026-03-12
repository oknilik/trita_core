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
        className="inline-flex items-baseline font-playfair font-black tracking-[-0.03em] text-[#1a1814]"
        style={{ fontSize }}
        aria-label="trita"
      >
        {"trit"}<span className="text-[#c8410a]">a</span>
      </span>
      {showText ? (
        <span
          className="font-ibm-plex-mono mt-1 tracking-[0.16em] uppercase text-[#5a5650]"
          style={{ fontSize: taglineSize }}
        >
          team intelligence
        </span>
      ) : null}
    </div>
  );
}
