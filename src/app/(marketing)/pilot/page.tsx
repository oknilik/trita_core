import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { PilotContent } from "./PilotContent";

// Statikus metadata a DEFAULT_LOCALE-lal — a tartalom nyelvváltását a
// kliens-oldali LocaleProvider kezeli (PilotContent).
export const metadata: Metadata = buildPageMetadata({
  path: "/pilot",
  title: "Pilotprogram — az első partnercsapatainknak | trita",
  description:
    "Csatlakozz a trita pilotprogramjához: mérhető csapatdinamika, személyiség- és 360°-os visszajelzés az első partnercsapatoknak, egyedi feltételekkel.",
  ogTitle: "Pilotprogram — az első partnercsapatainknak",
  ogDescription:
    "Csatlakozz a trita pilotprogramjához: mérhető csapatdinamika, személyiség- és 360°-os visszajelzés az első partnercsapatoknak.",
});

export default function PilotPage() {
  return <PilotContent />;
}
