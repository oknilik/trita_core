import type { Metadata } from "next";
import { PilotContent } from "./PilotContent";

// Statikus metadata a DEFAULT_LOCALE-lal — a tartalom nyelvváltását a
// kliens-oldali LocaleProvider kezeli (PilotContent).
export const metadata: Metadata = {
  title: "Pilotprogram — az első partnercsapatainknak | trita",
  description:
    "Csatlakozz a trita pilotprogramjához: mérhető csapatdinamika, személyiség- és 360°-os visszajelzés az első partnercsapatoknak, egyedi feltételekkel.",
  alternates: { canonical: "/pilot" },
  openGraph: {
    title: "Pilotprogram — az első partnercsapatainknak",
    description:
      "Csatlakozz a trita pilotprogramjához: mérhető csapatdinamika, személyiség- és 360°-os visszajelzés az első partnercsapatoknak.",
    url: "/pilot",
    siteName: "trita",
    locale: "hu_HU",
    type: "website",
  },
};

export default function PilotPage() {
  return <PilotContent />;
}
