import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import type { ReactNode } from "react";

interface PdfCalloutBoxProps {
  variant: "sage" | "bronze" | "dark";
  title?: string;
  children: ReactNode;
}

const STYLES = {
  sage: {
    bg: colors.sage100,
    border: colors.sage,
    titleColor: colors.sageDark,
  },
  bronze: {
    bg: colors.bronze100,
    border: colors.bronze,
    titleColor: colors.bronzeDark,
  },
  dark: {
    bg: colors.ink,
    border: colors.ink,
    titleColor: colors.bronzeLight,
  },
};

export function PdfCalloutBox({ variant, title, children }: PdfCalloutBoxProps) {
  const st = STYLES[variant];
  return (
    <View
      style={{
        backgroundColor: st.bg,
        borderLeft: `3 solid ${st.border}`,
        borderRadius: 4,
        padding: "8 10",
        marginBottom: 8,
      }}
    >
      {title && (
        <Text
          style={{
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: st.titleColor,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
