import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidTeamRoleSelectionSet } from "@/lib/team-role-questions";

// POST /api/candidate/[token]/team-role — a jelölt opcionális csapatszerep-
// kérdőívének beküldése (a TRITAN submit UTÁNI 2. lépés). Token-alapú,
// auth nélkül; csak akkor fogadjuk, ha a meghívón engedélyezve van, a
// fő teszt már beérkezett, és szerep-válasz még nincs.

const bodySchema = z.object({
  selections: z.record(z.string(), z.number()),
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

  // Kanonikus kiválasztás-validátor — ugyanaz, amit a két hitelesített
  // útvonal (api/team-roles/submit, api/team-roles/peers/submit) használ.
  // A kézi „elemszám + ismert id" ellenőrzés NEM zárta ki a rossz kiemelt-
  // darabszámot (pl. mind a 12 item 2-es súllyal → egyszerre több szerep
  // 100%-on); a validátor a „pontosan 3 kiemelt" szabályt is kikényszeríti.
  const selections = parsed.data.selections;
  if (!isValidTeamRoleSelectionSet(selections)) {
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
