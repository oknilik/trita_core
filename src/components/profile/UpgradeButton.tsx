"use client";

import Link from "next/link";

interface UpgradeButtonProps {
  tier: string;
  label: string;
}

// Consulting mode: paid tiers are provisioned manually, so the upgrade
// CTA routes to the contact page instead of a checkout flow.
export function UpgradeButton({ label }: UpgradeButtonProps) {
  return (
    <Link
      href="/contact"
      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sage px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
    >
      {label}
    </Link>
  );
}
