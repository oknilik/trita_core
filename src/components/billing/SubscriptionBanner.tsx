"use client";

import Link from "next/link";

type Props = {
  status: "past_due" | "trialing";
  trialDaysLeft?: number | null;
  billingUrl: string;
  locale?: string;
};

const isHu = (locale?: string) => !locale || locale === "hu" || locale === "de";

export function SubscriptionBanner({ status, trialDaysLeft, billingUrl, locale }: Props) {
  const hu = isHu(locale);

  if (status === "past_due") {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-rose-700">
            {hu
              ? "Fizetési probléma: az előfizetésed megújítása sikertelen volt. Frissítsd a fizetési adataidat a hozzáférés megtartásához."
              : "Payment issue: your subscription renewal failed. Update your payment details to keep access."}
          </p>
          <Link
            href={billingUrl}
            className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            {hu ? "Fizetési adatok frissítése" : "Update payment"}
          </Link>
        </div>
      </div>
    );
  }

  if (status === "trialing") {
    const days = trialDaysLeft ?? 0;
    const isUrgent = days <= 3;

    return (
      <div
        className={`rounded-lg border px-4 py-3 ${
          isUrgent
            ? "border-amber-200 bg-amber-50"
            : "border-sand bg-cream"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-sm font-medium ${
              isUrgent ? "text-amber-700" : "text-ink-body"
            }`}
          >
            {hu
              ? `A próbaidőszakodból ${days} nap van hátra.`
              : `${days} day${days !== 1 ? "s" : ""} left in your trial.`}
          </p>
          <Link
            href={billingUrl}
            className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg bg-sage px-4 text-sm font-semibold text-white transition hover:bg-sage-dark"
          >
            {hu ? "Előfizetés aktiválása" : "Activate subscription"}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
