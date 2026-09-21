import type { ReactNode } from "react";
import { Card } from "@/components/ui/primitives/Card";
import { cn } from "@/lib/ui/cn";
import styles from "./CandidateWorkshop.module.css";

export function CandidateWorkshopNote({
  children,
  tone = "neutral",
  label,
  className,
}: {
  children: ReactNode;
  tone?: "connection" | "difference" | "role" | "neutral";
  label?: string;
  className?: string;
}) {
  return (
    <Card
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn(styles.note, styles[tone], "min-w-0", className)}
    >
      {children}
    </Card>
  );
}
