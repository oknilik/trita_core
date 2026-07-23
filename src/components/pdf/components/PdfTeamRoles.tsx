import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface TeamRoleRole {
  name: string;
  subtitle: string;
  score: number;
  rank: number;
  /** Egy mondatos indoklás a becsült elsődleges szerephez (P5.3). */
  why?: string;
}

interface PdfTeamRolesProps {
  roles: TeamRoleRole[];
  locale?: "hu" | "en";
  /**
   * Pontszám-kijelzés csak MÉRT (kérdőíves) eredménynél — a profil-alapú
   * becslés pontszámai csak relatív rangsorra alkalmasak, az 1-2%-os
   * különbségek álprecizitást sugallnának (javítási terv 2026-07, P2.3).
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
    <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
      {roles.map((role, i) => {
        const rc = rankColors[i] ?? rankColors[2];
        const isPrimary = i === 0;
        return (
          <View
            key={role.name}
            style={{
              flex: isPrimary ? 1.4 : 1,
              padding: isPrimary ? "5 8" : "5 6",
              borderRadius: 6,
              border: isPrimary ? `1.5 solid ${colors.sage}` : `1 solid ${colors.cream500}`,
              backgroundColor: isPrimary ? colors.sage100 : colors.white,
            }}
          >
            <Text
              style={{
                fontSize: 5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                backgroundColor: rc.bg,
                color: rc.text,
                padding: "1.5 5",
                borderRadius: 2,
                alignSelf: "flex-start",
                marginBottom: 3,
              }}
            >
              {rc.label[locale]}
              {showScores ? ` · ${role.score}%` : ""}
            </Text>
            <Text style={{ fontFamily: "Fraunces", fontSize: isPrimary ? 9 : 8.5, color: colors.ink, marginBottom: 1 }}>
              {role.name}
            </Text>
            {role.why ? (
              <Text style={{ fontSize: 5.5, color: colors.ink500, lineHeight: 1.35, marginBottom: 1.5 }}>
                {role.why}
              </Text>
            ) : null}
            {role.subtitle ? (
              <Text style={{ fontSize: 6, color: colors.ink500, lineHeight: 1.3 }}>{role.subtitle}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
