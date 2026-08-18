import { View, Text } from "@react-pdf/renderer";
import { colors, type, chrome } from "../styles";
import { PdfWordmark } from "./PdfWordmark";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfFooterProps {
  locale?: Locale;
  /**
   * Hány számozáson KÍVÜLI oldal előzi meg az első tartalmi oldalt.
   * A riportban ez a borító (1) — így az első tartalmi oldal `1 / N`, és a
   * borítón nincs lábléc egyáltalán (PDF-audit 2026-08-18, P0/8).
   *
   * A react-pdf `pageNumber`/`totalPages` DOKUMENTUM-szintű, ezért a
   * borító-eltolást itt kell kivonni; automatikus (kényszerített) töréseknél
   * is helyes marad, mert mindkét szám a renderelt dokumentumból jön.
   */
  coverPages?: number;
}

// Fixed lábléc dinamikus oldalszámmal: ha egy szekció átcsúszik a
// következő oldalra, a számozás és a lábléc ott is helyes marad.

export function PdfFooter({ locale = "hu", coverPages = 1 }: PdfFooterProps) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: chrome.footerHeight,
        padding: "0 32",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: type.micro,
        color: colors.ink300,
        borderTop: `0.5 solid ${colors.sand}`,
      }}
    >
      <PdfWordmark size={8} color={colors.ink300} />
      <Text>trita.io · {t("pdf.footerTagline", locale)}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${Math.max(1, pageNumber - coverPages)} / ${Math.max(1, totalPages - coverPages)}`
        }
      />
    </View>
  );
}
