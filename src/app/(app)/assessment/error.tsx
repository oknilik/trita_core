"use client";

import { PageErrorState } from "@/components/ui/patterns/PageErrorState";

export default function AssessmentError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageErrorState error={error} reset={reset} />;
}
