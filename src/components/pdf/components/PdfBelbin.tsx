import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface BelbinRole {
  name: string;
  subtitle: string;
  score: number;
  rank: number;
}

export function PdfBelbin({ roles }: { roles: BelbinRole[] }) {
  const rankColors = [
    { bg: colors.sage, text: colors.white, label: "Elsődleges" },
    { bg: colors.bronze100, text: colors.bronzeDark, label: "Másodlagos" },
    { bg: colors.cream300, text: colors.ink300, label: "Harmadik" },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 5, marginBottom: 14 }}>
      {roles.map((role, i) => {
        const rc = rankColors[i] ?? rankColors[2];
        const isPrimary = i === 0;
        return (
          <View
            key={role.name}
            style={{
              flex: isPrimary ? 1.4 : 1,
              padding: isPrimary ? 10 : 8,
              borderRadius: 6,
              border: isPrimary ? `1.5 solid ${colors.sage}` : `1 solid ${colors.cream500}`,
              backgroundColor: isPrimary ? colors.sage100 : colors.white,
            }}
          >
            <Text
              style={{
                fontSize: 5.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                backgroundColor: rc.bg,
                color: rc.text,
                padding: "1.5 5",
                borderRadius: 2,
                alignSelf: "flex-start",
                marginBottom: 4,
              }}
            >
              {rc.label} · {role.score}%
            </Text>
            <Text style={{ fontFamily: "Fraunces", fontSize: isPrimary ? 11 : 10, color: colors.ink, marginBottom: 2 }}>
              {role.name}
            </Text>
            <Text style={{ fontSize: 7, color: colors.ink500, lineHeight: 1.3 }}>{role.subtitle}</Text>
          </View>
        );
      })}
    </View>
  );
}
