import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { getTestConfig, isLikertQuestion } from "@/lib/questions";
import type { TeaserScoringMetaItem } from "@/lib/guest-teaser";
import { TryCompleteClient } from "./TryCompleteClient";

// A vendég-teszt záróoldala. A szerver csak a minimális pontozási metát
// állítja elő (item-id → dimenzió + fordítottság) — így az azonnali
// eredmény-ízelítő kliens-oldalon, hálózati hívás és a teljes kérdésbank
// bundle-be kerülése nélkül számolható a localStorage-draftból.
export default function TryCompletePage() {
  const config = getTestConfig("TRITAN", "hu", DEFAULT_ASSESSMENT_FORM);
  const scoringMeta: TeaserScoringMetaItem[] = config.questions
    .filter(isLikertQuestion)
    .map((q) => ({
      id: q.id,
      dimension: q.dimension,
      reversed: Boolean(q.reversed),
    }));

  return <TryCompleteClient scoringMeta={scoringMeta} />;
}
