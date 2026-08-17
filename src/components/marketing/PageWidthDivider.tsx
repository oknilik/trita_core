import type { CSSProperties } from "react";

/**
 * A publikus oldalak szekcióhatára. Ugyanazt a szélességet és oldalmargót
 * használja, mint a lebegő NavBar, ezért az elválasztó nem fut ki a viewport
 * széléig, és minden marketingoldalon azonos vizuális tengelyre kerül.
 */
export function PageWidthDivider({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="page-width-divider"
      className={`mx-auto w-[calc(100%-1.5rem)] max-w-[1180px] border-t border-sand ${className}`}
      style={style}
    />
  );
}
