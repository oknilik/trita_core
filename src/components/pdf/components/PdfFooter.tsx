import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfFooterProps {
  pageNum: number;
  totalPages: number;
  locale?: string;
}

export function PdfFooter({ pageNum, totalPages, locale = "hu" }: PdfFooterProps) {
  const isHu = locale === "hu";

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "6 32",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 5,
        color: colors.ink300,
        borderTop: `0.5 solid ${colors.cream500}`,
      }}
    >
      <Text style={{ fontFamily: "Fraunces", fontSize: 6, color: "#3d6b5e" }}>
        tri<Text style={{ color: "#c17f4a" }}>ta</Text>
      </Text>
      <Text>trita.io · {isHu ? "Személyiség és csapatintelligencia" : "Personality and team intelligence"}</Text>
      <Text>
        {pageNum} / {totalPages}
      </Text>
    </View>
  );
}
