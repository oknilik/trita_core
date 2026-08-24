"use client";

import Link from "next/link";
import { DashboardActionCard } from "@/components/dashboard/DashboardPrimitives";
import { ChevronRightIcon } from "@/components/ui/icons";

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
              className="inline-flex text-xs font-semibold text-[var(--color-accent-primary-strong)] no-underline transition hover:text-bronze-dark"
            >
              {secondary.label}
              <ChevronRightIcon className="ml-1 inline h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      }
      cta={{ href: primary.href, label: primary.label, tone: "soft" }}
    />
  );
}
