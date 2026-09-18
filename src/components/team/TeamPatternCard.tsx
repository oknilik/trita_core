import Link from "next/link";
import Image from "next/image";
import { operatingIdentity } from "@/lib/team-operating-style/identity";
import type { TeamStyleSnapshot } from "@/lib/team-operating-style/comparison";

/** Only a published operating measurement supplies a team-pattern name here. */
export function TeamPatternCard({ snapshot, isHu }: { snapshot?: TeamStyleSnapshot | null; isHu: boolean }) {
  const locale = isHu ? "hu" : "en";
  const identity = operatingIdentity(snapshot, locale);
  return <section className="rounded-2xl border border-sand bg-surface-card p-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-sage">{isHu ? "Mért csapatminta · publikált riport" : "Measured team pattern · published report"}</p>
    <h2 className="mt-3 font-fraunces text-3xl text-ink">{identity.label}</h2>
    <p className="mt-3 text-sm leading-relaxed text-ink-body">{identity.note}</p>
    {identity.code && <>
      {identity.status === "descriptive" && <Image src={`/illustrations/operating-patterns/${identity.code}.svg`} width={400} height={224} alt={identity.label} className="mt-5 h-auto w-full max-w-sm" />}
      <Link href={`/operating-patterns?pattern=${identity.code}&lang=${locale}`} className="mt-4 inline-flex min-h-11 items-center text-sm text-sage-dark underline underline-offset-4">{identity.code} · {isHu ? "A minta megismerése" : "Explore this pattern"}</Link>
    </>}
    {snapshot?.operating && <p className="mt-3 text-xs text-muted">{isHu ? "Mérési időszak" : "Measurement period"}: {new Date(snapshot.operating.referenceStart).toLocaleDateString(isHu ? "hu-HU" : "en-GB", { timeZone: "UTC" })} – {new Date(snapshot.operating.referenceEnd).toLocaleDateString(isHu ? "hu-HU" : "en-GB", { timeZone: "UTC" })}</p>}
  </section>;
}
