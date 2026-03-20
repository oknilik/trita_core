import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Sikeres vásárlás | Trita",
  robots: { index: false },
};

const REDIRECT_MAP: Record<string, string> = {
  self_plus:      "/profile",
  self_reflect:   "/profile",
  team_scan:      "/dashboard",
  team_deep_dive: "/dashboard",
};

const MESSAGES: Record<string, string> = {
  self_plus:
    "Self Plus profilod aktiválva. Teljes személyiségprofil, munkastílus elemzés és fejlődési fókuszok várnak.",
  self_reflect:
    "Self Reflect csomagod aktiválva. Observer meghívókkal és fejlődési check-in-nel.",
  team_scan:
    "Team Scan aktiválva. A csapatod mintázata, heatmap-je és vezetői összefoglalója elérhető.",
  team_deep_dive:
    "Team Deep Dive aktiválva. A csapatod mély elemzése és 1 db beépített tanácsadói konzultáció vár rád.",
};

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/dashboard");

  let tier = "unknown";
  let teamId: string | undefined;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    tier = session.metadata?.tier ?? "unknown";
    teamId = session.metadata?.teamId || undefined;
  } catch {
    redirect("/dashboard");
  }

  const targetUrl =
    (tier === "team_scan" || tier === "team_deep_dive") && teamId
      ? `/team/${teamId}`
      : (REDIRECT_MAP[tier] ?? "/dashboard");

  const message = MESSAGES[tier] ?? "Vásárlásod sikeresen feldolgozva.";

  return (
    <div className="min-h-dvh bg-[#faf9f6] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <p
          className="font-playfair text-5xl"
          style={{ color: "#c8410a" }}
          aria-hidden="true"
        >
          ✦
        </p>
        <h1 className="mt-4 font-playfair text-2xl text-[#1a1814]">
          Sikeres vásárlás!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5a5650]">
          {message}
        </p>
        <a
          href={targetUrl}
          className="mt-8 inline-flex min-h-[44px] items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
        >
          Tovább →
        </a>
      </div>
    </div>
  );
}
