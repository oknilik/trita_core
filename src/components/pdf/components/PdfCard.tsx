import { View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { ReactNode } from "react";

// Megosztott kártya-építőelemek — az élő riport DashboardPanel +
// SectionHeader párjának PDF-megfelelője. Minden oldal ezekből épül,
// így a PDF egységesen a felület design-nyelvét tükrözi.

export function CardEyebrow({ label }: { label: string }) {
  return (
    <View style={s.cardEyebrowRow}>
      <View style={s.cardEyebrowLine} />
      <Text style={s.cardEyebrow}>{label}</Text>
    </View>
  );
}

export function PdfCard({
  eyebrow,
  children,
  wrap = true,
}: {
  eyebrow?: string;
  children: ReactNode;
  wrap?: boolean;
}) {
  return (
    <View style={s.card} wrap={wrap}>
      {eyebrow ? <CardEyebrow label={eyebrow} /> : null}
      {children}
    </View>
  );
}

// Folytatólagos oldalak fejléce: fehér sáv sage akcentussal — a
// StartPage nagy hero-jának visszafogott ismétlése.
export function PdfMiniHeader({
  userName,
  planLabel,
  date,
  locale = "hu",
}: {
  userName: string;
  planLabel: string;
  date: string;
  locale?: Locale;
}) {
  return (
    <View>
      <View style={{ height: 3, backgroundColor: colors.sage }} />
      <View
        style={{
          backgroundColor: colors.white,
          padding: "8 32",
          borderBottom: `1 solid ${colors.sand}`,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: colors.sage }}>
          tri<Text style={{ color: colors.bronze }}>ta</Text>
        </Text>
        <Text style={{ fontSize: 6, color: colors.ink300 }}>
          {userName} · {t("pdf.personalityProfile", locale)} · {planLabel} · {date}
        </Text>
      </View>
    </View>
  );
}
