import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { DIMENSION_GLYPHS } from "@/lib/type-glyph";
import { personalityNoun } from "@/lib/personality-type";
export const metadata = { title: "Karakterábrák | trita" };
export default async function CharacterGlyphGuide() {
  const locale = await getServerLocale();
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header className="max-w-3xl space-y-4">
        <SectionEyebrow>
          {t("candidateProgram.personalityArtwork", locale)}
        </SectionEyebrow>
        <h1 className="font-fraunces text-display text-ink">
          {t("candidateProgram.artworkGuideTitle", locale)}
        </h1>
        <p className="text-body text-ink-body">
          {t("candidateProgram.artworkGuideIntro", locale)}
        </p>
      </header>
      <Card spacing="lg" className="space-y-4">
        <p className="text-body text-ink-body">
          {t("candidateProgram.artworkGuideShape", locale)}
        </p>
        <p className="text-body text-ink-body">
          {t("candidateProgram.artworkGuidePrivacy", locale)}
        </p>
      </Card>
      <section>
        <h2 className="mb-5 font-fraunces text-heading text-ink">
          {t("candidateProgram.artworkGuideExamples", locale)}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HEXACO_ORDER.map((code) => (
            <Card key={code}>
              <TypeGlyph
                primaryCode={code}
                secondaryCode={code}
                typeLabel={personalityNoun(code, locale)!}
                locale={locale}
                variant="card"
                className="mx-auto w-full max-w-48"
              />
              <h3 className="font-fraunces text-heading text-ink">
                {personalityNoun(code, locale)}
              </h3>
              <p className="mt-2 text-caption text-muted">
                {DIMENSION_GLYPHS[code].formName[locale]}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
