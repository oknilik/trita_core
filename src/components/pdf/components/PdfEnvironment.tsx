import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface EnvItem {
  label: string;
  value: string;
  position: number;
  color: "sage" | "bronze";
  low: string;
  high: string;
  desc: string;
}

export function PdfEnvironment({ items }: { items: EnvItem[] }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            padding: "3 6",
            backgroundColor: colors.cream300,
            borderRadius: 4,
            marginBottom: 3,
          }}
        >
          <Text style={{ width: 78, fontSize: 7, fontWeight: 500, color: colors.ink }}>{item.label}</Text>
          <View style={{ flex: 1 }}>
            <View style={{ height: 2, backgroundColor: colors.cream500, borderRadius: 1, position: "relative" }}>
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  left: `${item.position}%`,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: item.color === "sage" ? colors.sage : colors.bronze,
                  border: "1.5 solid white",
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
              <Text style={{ fontSize: 4.5, color: colors.ink300 }}>{item.low}</Text>
              <Text style={{ fontSize: 4.5, color: colors.ink300 }}>{item.high}</Text>
            </View>
          </View>
          <Text style={{ width: 100, textAlign: "right", fontSize: 6.5, color: colors.ink300 }}>{item.desc}</Text>
        </View>
      ))}
    </View>
  );
}
