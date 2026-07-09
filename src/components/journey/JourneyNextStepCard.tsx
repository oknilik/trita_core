"use client";

import Link from "next/link";
import { DashboardActionCard } from "@/components/dashboard/DashboardPrimitives";

export interface JourneyNextStepCta {
  label: string;
  href: string;
}

export interface JourneyNextStepCardProps {
  eyebrow: string;
  title: string;
  description: string;
  primary: JourneyNextStepCta;
  secondary?: JourneyNextStepCta | null;
}

export function JourneyNextStepCard({
  eyebrow,
  title,
  description,
  primary,
  secondary,
}: JourneyNextStepCardProps) {
  return (
    <DashboardActionCard
      eyebrow={eyebrow}
      title={title}
      body={
        <div className="space-y-3">
          <p>{description}</p>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex text-[12px] font-semibold text-bronze no-underline transition hover:text-bronze-dark"
            >
              {secondary.label} →
            </Link>
          ) : null}
        </div>
      }
      cta={{ href: primary.href, label: primary.label, tone: "soft" }}
    />
  );
}
