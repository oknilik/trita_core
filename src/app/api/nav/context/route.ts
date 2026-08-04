import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { resolveWorkspaceNavContext } from "@/lib/navigation/nav-context.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/nav/context — a belépett munkaterület-fejléc (NavHeaderUI)
 * adatcsomagja. A marketing zóna (statikus, Clerk-mentes shell) ezt kéri le
 * kliens-oldalon, hogy a belépett látogató a nem védett oldalakon (blog stb.)
 * is a megszokott app-fejlécet lássa. Kijelentkezve 401.
 */
export async function GET() {
  const { userId } = await getServerAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = await getServerLocale();
  const { navData, helpAudience } = await resolveWorkspaceNavContext(userId, locale);

  if (!navData) {
    // Belépve, de nincs profil (edge) — a marketing a könnyű navon marad.
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  return NextResponse.json({ navData, helpAudience });
}
