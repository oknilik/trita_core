import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuth } from "@/lib/auth-server";
import { acceptActiveLegalCampaign } from "@/lib/legal/acceptance.server";

const acceptanceSchema = z.object({ campaignId: z.string().cuid() }).strict();

export async function POST(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = acceptanceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const result = await acceptActiveLegalCampaign(userId, parsed.data.campaignId);
  if (!result.ok) {
    const status = result.error === "STALE_CAMPAIGN" ? 409 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
