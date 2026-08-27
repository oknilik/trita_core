import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";

const path = "/team-dynamics";
const title = "Csapatműködés és csapatdiagnosztika | trita";
const description =
  "Ismerjétek meg a természetes csapatszerepeket, a bizalmi hálót és a pszichológiai biztonságot egy tanácsadó által értelmezett csapatképben.";

export const metadata: Metadata = buildPageMetadata({
  path,
  title,
  description,
  ogTitle: "Csapatműködés és csapatdiagnosztika | trita",
});

export default function TeamDynamicsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <JsonLd
        data={buildWebPageJsonLd({
          path,
          title,
          description,
          about: ["Csapatműködés", "Csapatdiagnosztika", "Bizalmi háló", "Pszichológiai biztonság"],
        })}
      />
      <LandingContent initialMode="team" />
    </main>
  );
}
