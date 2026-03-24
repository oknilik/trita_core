import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfFooterProps {
  pageNum: number;
  totalPages: number;
}

export function PdfFooter({ pageNum, totalPages }: PdfFooterProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "8 40",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 6,
        color: colors.ink300,
        borderTop: `1 solid ${colors.cream500}`,
      }}
    >
      <Text style={{ fontFamily: "Fraunces", fontSize: 8, color: "rgba(26,26,46,0.2)" }}>
        trita
      </Text>
      <Text>trita.io · Személyiség és csapatintelligencia</Text>
      <Text>
        {pageNum} / {totalPages}
      </Text>
    </View>
  );
}
