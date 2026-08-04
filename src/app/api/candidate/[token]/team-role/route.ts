import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TEAM_ROLE_ITEMS,
  TEAM_ROLE_MIN_SELECT,
  TEAM_ROLE_MAX_SELECT,
} from "@/lib/team-role-questions";

// POST /api/candidate/[token]/team-role — a jelölt opcionális csapatszerep-
// kérdőívének beküldése (a TRITAN submit UTÁNI 2. lépés). Token-alapú,
// auth nélkül; csak akkor fogadjuk, ha a meghívón engedélyezve van, a
// fő teszt már beérkezett, és szerep-válasz még nincs.

const VALID_ITEM_IDS = new Set(TEAM_ROLE_ITEMS.map((item) => item.id));

const bodySchema = z.object({
  selections: z.record(z.string(), z.union([z.literal(1), z.literal(2)])),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const selections = parsed.data.selections;
  const keys = Object.keys(selections);
  if (
    keys.length < TEAM_ROLE_MIN_SELECT ||
    keys.length > TEAM_ROLE_MAX_SELECT ||
    keys.some((k) => !VALID_ITEM_IDS.has(k))
  ) {
    return NextResponse.json({ error: "INVALID_SELECTIONS" }, { status: 400 });
  }

  const invite = await prisma.candidateInvite.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      includeTeamRole: true,
      result: { select: { id: true, teamRoleSelections: true } },
    },
  });

  if (!invite) return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  if (!invite.includeTeamRole) {
    return NextResponse.json({ error: "NOT_ENABLED" }, { status: 400 });
  }
  if (invite.status === "CANCELED") {
    return NextResponse.json({ error: "REVOKED" }, { status: 409 });
  }
  if (!invite.result) {
    return NextResponse.json({ error: "MAIN_ASSESSMENT_MISSING" }, { status: 409 });
  }
  if (invite.result.teamRoleSelections) {
    return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });
  }

  await prisma.candidateResult.update({
    where: { id: invite.result.id },
    data: { teamRoleSelections: selections },
  });

  return NextResponse.json({ ok: true });
}
