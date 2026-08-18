"use client";

import { PageErrorState } from "@/components/ui/patterns/PageErrorState";

export default function OrgError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageErrorState error={error} reset={reset} surface="org" />;
}
