import { CandidateWorkshopNote } from "@/components/candidate/CandidateWorkshopNote";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/auth-server";
import { loadCandidateShare } from "@/lib/candidate-programs/share.server";
import { CandidateCharacterCaption } from "@/components/candidate/CandidateCharacterCaption";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import { Card } from "@/components/ui/primitives/Card";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jelölti visszajelzés | trita",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer" as const,
};
export default async function CandidateSharedReport({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getServerLocale();
  const { userId } = await getServerAuth();
  const share = await loadCandidateShare(token, userId);
  if (!share) notFound();
  const { data } = share;
  return (
    <PlatformPageShell
      surface={share.audience === "manager" ? "org" : "self"}
      contentClassName="max-w-6xl space-y-6 px-4 py-8"
    >
      <p className="text-caption text-muted">
        {t("candidateProgram.reviewed", locale)} · v{data.revision}
      </p>
      <h1 className="font-fraunces text-title text-ink">{data.name}</h1>
      <p className="text-caption text-muted">
        {data.position} · {data.measuredAt?.slice(0, 10)}
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {data.artwork && (
          <Card className="min-w-0 lg:order-2" spacing="lg">
            <SectionEyebrow>
              {t("candidateProgram.personalityArtwork", locale)}
            </SectionEyebrow>
            <CandidateCharacterCaption artwork={data.artwork} locale={locale} />
            <TypeGlyph
              {...data.artwork}
              typeLabel={t("candidateProgram.personalityArtwork", locale)}
              locale={locale}
              variant="card"
              className="mx-auto w-full max-w-sm"
            />
            <p className="text-caption text-muted">
              {t("candidateProgram.artworkNote", locale)}
            </p>
          </Card>
        )}
        <CandidateWorkshopNote
          tone={share.audience === "candidate" ? "connection" : "role"}
          className="lg:order-1"
        >
          <SectionEyebrow tone="candidate" className="mb-4">
            {t("candidateProgram.reviewed", locale)}
          </SectionEyebrow>

          <h2 className="font-fraunces text-heading text-ink">
            {t(
              share.audience === "candidate"
                ? "candidateProgram.candidateSummary"
                : "candidateProgram.managerSummary",
              locale,
            )}
          </h2>
          <p className="mt-4 whitespace-pre-wrap break-words text-body text-ink-body">
            {data.summary}
          </p>
        </CandidateWorkshopNote>
      </div>
    </PlatformPageShell>
  );
}
