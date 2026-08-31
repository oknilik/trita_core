import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";
import { SEO_INTENTS } from "@/lib/seo-intents";

const seoIntent = SEO_INTENTS.teamDynamics;
const path = seoIntent.path;
const title = "Csapatdiagnosztika – értsétek meg, hogyan működtök együtt | trita";
const description =
  "Ismerjétek meg a természetes csapatszerepeket, a bizalmi hálót és a pszichológiai biztonságot egy tanácsadó által értelmezett csapatképben.";

export const metadata: Metadata = buildPageMetadata({
  path,
  title,
  description,
  ogTitle: "Csapatdiagnosztika és csapatdinamika | trita",
});

export default function TeamDynamicsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <JsonLd
        data={buildWebPageJsonLd({
          path,
          title,
          description,
          about: seoIntent.topics,
          breadcrumb: [
            { name: "Főoldal", path: "/" },
            { name: "Csapatdiagnosztika", path },
          ],
        })}
      />
      <LandingContent initialMode="team" />
    </main>
  );
}
