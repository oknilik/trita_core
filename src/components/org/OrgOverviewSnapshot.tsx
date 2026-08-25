import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

interface OrgOverviewSnapshotProps {
  isHu: boolean;
  memberCount: number;
  completedMemberCount: number;
  teamCount: number;
  activeCampaignCount: number;
  activeDoneCount: number;
  activeParticipantCount: number;
}

function percentage(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export function OrgOverviewSnapshot({
  isHu,
  memberCount,
  completedMemberCount,
  teamCount,
  activeCampaignCount,
  activeDoneCount,
  activeParticipantCount,
}: OrgOverviewSnapshotProps) {
  const completionPct = percentage(completedMemberCount, memberCount);
  const complete = memberCount > 0 && completedMemberCount >= memberCount;
  const copy = isHu
    ? {
        eyebrow: "Állapotkép",
        heading: "A szervezet közös képe",
        status: complete ? "Az alapok készen állnak" : "A közös kép épül",
        profile: "Szervezeti profil",
        title: complete ? "Mindenki készen áll" : "A szervezeti kép épül",
        body: complete
          ? `Mind a ${memberCount} személyiségprofil elkészült. Most a csapatok riportállapota mutatja, hol érdemes továbblépni.`
          : `${completedMemberCount} / ${memberCount} személyiségprofil elkészült. A közös kép minden új kitöltéssel pontosabbá válik.`,
        assessment: "Személyiségprofil",
        teams: "Csapatok",
        active: "Aktív mérési kör",
        noneActive: "Nincs folyamatban",
      }
    : {
        eyebrow: "Snapshot",
        heading: "Your organization picture",
        status: complete ? "The foundations are ready" : "The shared picture is growing",
        profile: "Organization profile",
        title: complete ? "Everyone is ready" : "The organization picture is growing",
        body: complete
          ? `All ${memberCount} personality profiles are complete. Team report status now shows where to move next.`
          : `${completedMemberCount} / ${memberCount} personality profiles are complete. Every completion makes the shared picture clearer.`,
        assessment: "Personality profiles",
        teams: "Teams",
        active: "Active measurement round",
        noneActive: "None in progress",
      };

  return (
    <section aria-labelledby="org-overview-snapshot-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionEyebrow tone="org">{copy.eyebrow}</SectionEyebrow>
          <h2
            id="org-overview-snapshot-title"
            className="mt-1 font-fraunces text-3xl text-ink"
          >
            {copy.heading}
          </h2>
        </div>
        <span
          className={[
            "hidden rounded-full px-3 py-1.5 text-note font-semibold sm:inline-flex",
            complete
              ? "bg-state-success-bg text-state-success-fg"
              : "bg-[var(--color-layer-org-soft)] text-[var(--color-layer-org-bright)]",
          ].join(" ")}
        >
          {copy.status}
        </span>
      </div>

      <Card
        as="div"
        spacing="none"
        className="grid overflow-hidden border-surface-org-border md:grid-cols-[1.3fr_.7fr]"
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-5 px-5 py-6 sm:px-7 sm:py-7">
          <div
            className="grid h-24 w-24 place-items-center rounded-full p-2.5"
            style={{
              background: `conic-gradient(var(--color-layer-org-bright) ${completionPct}%, color-mix(in srgb, var(--color-layer-org-bright) 12%, transparent) 0)`,
            }}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-surface-card font-fraunces text-2xl text-ink">
              {completionPct}%
            </div>
          </div>
          <div>
            <p className="text-label uppercase text-[var(--color-layer-org-bright)]">
              {copy.profile}
            </p>
            <h3 className="mt-1.5 font-fraunces text-2xl text-ink">{copy.title}</h3>
            <p className="mt-2 text-caption leading-relaxed text-ink-body">{copy.body}</p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 bg-[var(--color-layer-org-soft)]/65 px-5 py-6 sm:px-6">
          <div className="flex items-center justify-between gap-3 text-note text-ink-body">
            <span>{copy.assessment}</span>
            <strong className="font-semibold text-ink">
              {completedMemberCount} / {memberCount}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-note text-ink-body">
            <span>{copy.teams}</span>
            <strong className="font-semibold text-ink">{teamCount}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-note text-ink-body">
            <span>{copy.active}</span>
            {activeCampaignCount > 0 ? (
              <strong className="font-semibold text-ink">
                {activeDoneCount} / {activeParticipantCount}
              </strong>
            ) : (
              <span className="text-muted">{copy.noneActive}</span>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
