import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n-server";
import { EmbeddedCheckoutClient } from "./EmbeddedCheckoutClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Előfizetés | Trita", robots: { index: false } };
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; qty?: string }>;
}) {
  const [locale, { userId }, { plan, qty }] = await Promise.all([
    getServerLocale(),
    auth(),
    searchParams,
  ]);

  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_ADMIN")) {
    redirect("/dashboard");
  }

  const isHu = locale !== "en";
  const priceKey = plan ?? "org_monthly";
  const quantity = qty ? Math.max(1, parseInt(qty, 10) || 1) : undefined;

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
          // előfizetés
        </p>
        <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] mb-2">
          {isHu ? "Előfizetés aktiválása" : "Activate subscription"}
        </h1>
        <p className="text-sm text-[#7a756e] mb-8">
          {isHu
            ? "A fizetés biztonságos — a Stripe kezeli az adataidat."
            : "Payment is secure — handled by Stripe."}
        </p>

        <EmbeddedCheckoutClient priceKey={priceKey} quantity={quantity} />
      </main>
    </div>
  );
}
