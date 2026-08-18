import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

// ─────────────────────────────────────────────────────────────────────────────
// Kanonikus Trita szójel PDF-ben — a webes TritaWordmark (TritaLogo.tsx) párja:
// egyszínű „trıta" Fraunces Black-ben, EGYETLEN bronz akcentussal az i pontján.
//
// A korábbi PDF-változatok saját, ad-hoc felosztást használtak („tri" sage +
// „ta" bronze), oldalanként külön inline kóddal — három helyen három kicsit
// más márkajel. Innentől mindenhol EZ a komponens fut (borító, fejléc, lábléc).
//
// A pontatlan i (U+0131, dotless i) benne van a Fraunces cmap-jában; a pont
// külön abszolút pozicionált kör, hogy a pont színe önállóan bronz maradhasson
// anélkül, hogy az egész betű kiemelt lenne.
// ─────────────────────────────────────────────────────────────────────────────

interface PdfWordmarkProps {
  /** Betűméret pt-ban — minden más arány ebből származik. */
  size?: number;
  /** A betűk színe (a pont mindig bronz, kivéve ha `dotColor` felülírja). */
  color?: string;
  dotColor?: string;
  opacity?: number;
}

export function PdfWordmark({
  size = 12,
  color = colors.ink,
  dotColor = colors.bronze,
  opacity,
}: PdfWordmarkProps) {
  const letter = {
    fontFamily: "Fraunces" as const,
    fontWeight: 600 as const,
    fontSize: size,
    color,
    letterSpacing: -size * 0.03,
  };
  const dot = size * 0.2;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", opacity }}>
      <Text style={letter}>tr</Text>
      <View style={{ position: "relative" }}>
        <Text style={letter}>ı</Text>
        <View
          style={{
            position: "absolute",
            top: size * 0.08,
            left: size * 0.09,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: dotColor,
          }}
        />
      </View>
      <Text style={letter}>ta</Text>
    </View>
  );
}
