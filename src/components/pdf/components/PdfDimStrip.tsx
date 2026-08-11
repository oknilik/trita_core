import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { dimColors } from "@/lib/color-system";
import { poleAwareDimensionLabel } from "@/lib/profile-content";

interface Dim {
  name: string;
  shortName: string;
  value: number;
  /** Belső dimenziókód — a pólus-tudatos címkéhez (E alacsony = „stabil"). */
  code?: string;
}

// SZÍN = IDENTITÁS (2026-08-11, ld. DimensionAccordion fejkomment): a
// korábbi tier-rámpa (zsálya/bronz/ink300) értékelést vitt egy leíró
// skálára, és a 70-es vágása a mérési hibán belül járt. A PDF a literál
// hex-palettából dolgozik — a react-pdf nem old fel CSS-változót.
export function PdfDimStrip({ dimensions, locale = "hu" }: { dimensions: Dim[]; locale?: "hu" | "en" }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 6, border: `1 solid ${colors.cream500}`, borderRadius: 4 }}>
      {dimensions.map((dim, i) => {
        const dc = dimColors(dim.code ?? "");
        const tc = dc.strong;
        return (
          <View
            key={dim.name}
            style={{
              flex: 1,
              padding: "6 4",
              alignItems: "center",
              borderRight: i < dimensions.length - 1 ? `1 solid ${colors.cream500}` : undefined,
            }}
          >
            <Text style={{ fontSize: 5.5, color: colors.ink300, marginBottom: 2 }}>{dim.shortName}</Text>
            <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: tc, marginBottom: 2 }}>{dim.value}</Text>
            <Text
              style={{
                fontSize: 5.5,
                fontWeight: 600,
                backgroundColor: dc.soft,
                color: tc,
                padding: "1 3",
                borderRadius: 2,
                marginBottom: 2,
              }}
            >
              {poleAwareDimensionLabel(dim.code, dim.value, locale)}
            </Text>
            <View style={{ width: "80%", height: 2, backgroundColor: colors.cream500, borderRadius: 1 }}>
              <View
                style={{
                  width: `${dim.value}%`,
                  height: 2,
                  backgroundColor: dc.base,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
