"use client";

import { useCallback } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";

interface Props {
  priceKey: string;
  quantity?: number;
}

export function EmbeddedCheckoutClient({ priceKey, quantity }: Props) {
  const fetchClientSecret = useCallback(async () => {
    const body: Record<string, unknown> = { priceKey };
    if (quantity && quantity > 1) body.quantity = quantity;
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error("Failed to create checkout session");
    }

    const { clientSecret } = await res.json();
    return clientSecret as string;
  }, [priceKey, quantity]);

  return (
    <div className="rounded-2xl border border-sand bg-white overflow-hidden shadow-sm">
      <EmbeddedCheckoutProvider
        stripe={getStripe()}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
