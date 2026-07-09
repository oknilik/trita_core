import { NextResponse } from "next/server";

/**
 * Deprecated route.
 *
 * Replaced by: POST /api/billing/create-payment
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "DEPRECATED_ENDPOINT",
      message: "Use /api/billing/create-payment",
      replacement: "/api/billing/create-payment",
    },
    { status: 410 },
  );
}

