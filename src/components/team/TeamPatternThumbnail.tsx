import Image from "next/image";
import type { operatingIdentity } from "@/lib/team-operating-style/identity";

/** A mixed illustration is a visual companion, never an additional T16 type. */
export function TeamPatternThumbnail({ identity, isHu, className = "" }: {
  identity: ReturnType<typeof operatingIdentity>;
  isHu: boolean;
  className?: string;
}) {
  // Missing measurement is not evidence of mixed behavior.
  if (identity.status === "missing") return null;
  const definite = identity.status === "descriptive" && identity.code;
  return <Image
    src={`/illustrations/operating-patterns/${definite ? identity.code : "MIXED"}.svg`}
    alt={definite ? identity.label : isHu
      ? "Különböző absztrakt karakterek – egyetlen mintába nem sorolható csapatkép"
      : "Different abstract characters – a team picture without one definitive pattern"}
    width={400}
    height={224}
    className={`h-auto w-full object-contain ${className}`}
  />;
}
