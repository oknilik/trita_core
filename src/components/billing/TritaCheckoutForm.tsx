"use client";

import { useState, FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";

// ── Inner form (must be inside <Elements>) ──────────────────────────────────

interface PaymentFormProps {
  returnUrl: string;
  mode: "payment" | "subscription";
  locale: string;
  onSuccess?: () => void;
}

function PaymentForm({ returnUrl, mode, locale, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const isHu = locale !== "en";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? (isHu ? "Hiba történt." : "An error occurred."));
      setProcessing(false);
      return;
    }

    const confirmFn =
      mode === "subscription"
        ? stripe.confirmPayment
        : stripe.confirmPayment;

    const { error: confirmError } = await confirmFn({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (confirmError) {
      setError(
        confirmError.message ??
          (isHu ? "A fizetés sikertelen. Próbáld újra." : "Payment failed. Please try again."),
      );
      setProcessing(false);
    } else {
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
        onLoadError={(event) => {
          console.error("[TritaCheckout] PaymentElement loaderror", event);
          setError(
            isHu
              ? "A fizetési modul nem tölthető be. Ellenőrizd a Stripe kulcsok beállítását (publishable/secret), majd próbáld újra."
              : "The payment module could not be loaded. Check Stripe key configuration (publishable/secret) and try again.",
          );
          setProcessing(false);
        }}
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="min-h-[48px] w-full rounded-xl bg-sage text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing
          ? (isHu ? "Feldolgozás..." : "Processing...")
          : (isHu ? "Fizetés" : "Pay now")}
      </button>

      <p className="text-center text-[10px] text-muted">
        {isHu
          ? "A fizetés biztonságos, a Stripe kezeli."
          : "Payment is secure, handled by Stripe."}
      </p>
    </form>
  );
}

// ── Outer wrapper (loads Stripe Elements) ───────────────────────────────────

interface TritaCheckoutFormProps {
  clientSecret: string;
  returnUrl: string;
  mode: "payment" | "subscription";
  locale: string;
  onSuccess?: () => void;
}

export function TritaCheckoutForm({
  clientSecret,
  returnUrl,
  mode,
  locale,
  onSuccess,
}: TritaCheckoutFormProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#4a6e5b",
            colorBackground: "#ffffff",
            colorText: "#1a1814",
            colorDanger: "#e53e3e",
            fontFamily: "system-ui, -apple-system, sans-serif",
            borderRadius: "10px",
          },
        },
        locale: locale === "hu" ? "hu" : "en",
      }}
    >
      <PaymentForm
        returnUrl={returnUrl}
        mode={mode}
        locale={locale}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
