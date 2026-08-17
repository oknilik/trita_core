"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorScreen error={error} reset={reset} titleKey="errors.dashboardTitle" surface="dashboard" />
  );
}
