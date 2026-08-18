import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import type { ReportTeamRoleView } from "@/lib/profile-report-view-model";

interface PdfTeamRolesProps {
  roles: ReportTeamRoleView[];
  locale?: "hu" | "en";
  /**
   * Pontszám-kijelzés csak MÉRT (kérdőíves) eredménynél — a profil-alapú
   * becslés pontszámai csak relatív rangsorra alkalmasak, az 1-2%-os
   * különbségek álprecizitást sugallnának.
   */
  showScores?: boolean;
}

export function PdfTeamRoles({ roles, locale = "hu", showScores = false }: PdfTeamRolesProps) {
  const rankColors = [
    { bg: colors.sage, text: colors.white, label: { hu: "Elsődleges", en: "Primary" } },
    { bg: colors.bronze100, text: colors.bronzeDark, label: { hu: "Jelentős", en: "Notable" } },
    { bg: colors.cream300, text: colors.ink300, label: { hu: "Lehetséges", en: "Possible" } },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 7 }}>
      {roles.map((role, i) => {
        const rc = rankColors[i] ?? rankColors[2];
        const isPrimary = i === 0;
        return (
          <View
            key={role.name}
            style={{
              flex: isPrimary ? 1.35 : 1,
              padding: "11 12",
              borderRadius: 10,
              border: isPrimary ? `1.5 solid ${colors.sage}` : `1 solid ${colors.cream500}`,
              backgroundColor: isPrimary ? colors.sage100 : colors.white,
            }}
          >
            <Text
              style={{
                fontSize: type.caption,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.9,
                backgroundColor: rc.bg,
                color: rc.text,
                padding: "2 6",
                borderRadius: 3,
                alignSelf: "flex-start",
                marginBottom: 6,
              }}
            >
              {rc.label[locale]}
              {showScores ? ` · ${role.score}%` : ""}
            </Text>
            <Text
              style={{
                fontFamily: "Fraunces",
                fontSize: type.subhead,
                color: colors.ink,
                marginBottom: 3,
              }}
            >
              {role.name}
            </Text>
            {role.why ? (
              <Text
                style={{
                  fontSize: type.caption,
                  color: colors.ink500,
                  lineHeight: type.lineHeight.caption,
                  marginBottom: 3,
                }}
              >
                {role.why}
              </Text>
            ) : null}
            {role.subtitle ? (
              <Text style={{ fontSize: type.caption, color: colors.ink300 }}>{role.subtitle}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
