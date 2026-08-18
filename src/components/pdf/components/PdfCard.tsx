import { View, Text } from "@react-pdf/renderer";
import { s, colors, type, chrome } from "../styles";
import { PdfWordmark } from "./PdfWordmark";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { ReactNode } from "react";

// Megosztott kártya-építőelemek — az élő riport Card + SectionHeader párjának
// PDF-megfelelője. Minden oldal ezekből épül, így a PDF egységesen a felület
// design-nyelvét tükrözi: 12 pt sarok, 14–16 pt belső padding, egy kártya =
// egy tartalmi egység (PDF-audit 2026-08-18, P1/11).

export function CardEyebrow({ label }: { label: string }) {
  return (
    <View style={s.cardEyebrowRow}>
      <View style={s.cardEyebrowLine} />
      <Text style={s.cardEyebrow}>{label}</Text>
    </View>
  );
}

/**
 * Szekciócím fejezeten belül: Fraunces 15 pt + opcionális eyebrow.
 * A korábbi „minden cím apró uppercase eyebrow" gyakorlat helyett ez adja a
 * második címszintet (a fejezetcím alatt, a kártyacím fölött).
 */
export function PdfSectionHeader({
  title,
  eyebrow,
  description,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
}) {
  return (
    <View wrap={false} style={{ marginBottom: 8 }}>
      {eyebrow ? <CardEyebrow label={eyebrow} /> : null}
      <Text style={s.sectionTitle}>{title}</Text>
      {description ? (
        <Text style={{ ...s.caption, color: colors.ink500, marginTop: -2 }}>{description}</Text>
      ) : null}
    </View>
  );
}

// Alapértelmezetten wrap={false}: egy kártya (összetartozó blokk) nem törik
// ketté oldalhatáron — ha nem fér ki, EGYBEN csúszik a következő oldalra.
//
// Ez nem csak esztétika: a react-pdf a törhető konténernél a fejlécet még
// kirakja a lap aljára, a tartalmat viszont már a következőre viszi
// (`shouldBreak`: törhető gyereknél a `minPresenceAhead` nem érvényesül), így
// árva, üres kártyahéj marad a lap alján. A riport minden kártyája bőven egy
// lapnál kisebb, ezért a helyes viselkedés az egészben-lecsúszás.
//
// `wrap={true}` CSAK olyan blokknál indokolt, amely önmagában meghaladhat egy
// teljes lapot — ilyen jelenleg nincs a riportban.
export function PdfCard({
  eyebrow,
  title,
  children,
  wrap = false,
  tone = "white",
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  wrap?: boolean;
  /** A tónus ugyanazt jelenti, mint a weben: sage = erőforrás, bronze = figyelendő. */
  tone?: "white" | "sage" | "bronze" | "muted";
}) {
  const toneStyle =
    tone === "sage"
      ? { backgroundColor: colors.sage100, border: `1 solid ${colors.sage200}` }
      : tone === "bronze"
        ? { backgroundColor: colors.bronze100, border: `1 solid ${colors.bronze200}` }
        : tone === "muted"
          ? { backgroundColor: colors.cream300, border: `1 solid ${colors.sand}` }
          : {};

  return (
    <View style={{ ...s.card, ...toneStyle }} wrap={wrap}>
      {eyebrow ? <CardEyebrow label={eyebrow} /> : null}
      {title ? <Text style={s.subhead}>{title}</Text> : null}
      {children}
    </View>
  );
}

// Folytatólagos oldalak fejléce: fehér sáv sage akcentussal — a
// borító hero-jának visszafogott ismétlése, a kanonikus szójellel.
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
    // fixed + abszolút: minden lap tetején megjelenik, de NEM ül a flow-ban —
    // a helyét a lap paddingTop-ja foglalja (styles.chrome.headerHeight), így
    // az áttört tartalom nem úszik be alá.
    <View fixed style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
      <View style={{ height: 3, backgroundColor: colors.sage }} />
      <View
        style={{
          backgroundColor: colors.white,
          height: chrome.headerHeight - 3,
          padding: "0 32",
          borderBottom: `1 solid ${colors.sand}`,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <PdfWordmark size={11} color={colors.ink} />
        <Text style={{ fontSize: type.caption, color: colors.ink300 }}>
          {userName} · {t("pdf.personalityProfile", locale)} · {planLabel} · {date}
        </Text>
      </View>
    </View>
  );
}
