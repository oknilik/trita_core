import { CandidateWorkshopNote } from "@/components/candidate/CandidateWorkshopNote";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { candidateOrgEnabled } from "@/lib/candidate-programs/service.server";
import { getServerLocale } from "@/lib/i18n-server";
import { CandidateProfileChart } from "@/components/candidate/CandidateProfileChart";
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
  const share = await prisma.candidateReportShare.findUnique({
    where: { token },
    include: {
      report: {
        include: { invite: { select: { orgId: true, status: true } } },
      },
    },
  });
  if (
    !share ||
    share.revokedAt ||
    share.expiresAt <= new Date() ||
    share.report.invite.status === "CANCELED" ||
    !(await candidateOrgEnabled(share.report.invite.orgId))
  )
    notFound();
  const data = share.snapshot as {
    name: string | null;
    position: string | null;
    summary: string;
    dimensions: Record<string, number>;
    measuredAt: string;
    revision: number;
  };
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <p className="text-caption text-muted">
        {t("candidateProgram.reviewed", locale)} · v{data.revision}
      </p>
      <h1 className="font-fraunces text-title text-ink">{data.name}</h1>
      <p className="text-caption text-muted">
        {data.position} · {data.measuredAt?.slice(0, 10)}
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 lg:order-2">
          <CandidateProfileChart
            dimensions={data.dimensions ?? {}}
            locale={locale}
          />
        </div>
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
    </main>
  );
}
