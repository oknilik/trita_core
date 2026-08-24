import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkTokenRateLimit } from "@/lib/rate-limit";
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
  const rateLimitResponse = await checkTokenRateLimit("candidate", token);
  if (rateLimitResponse) return rateLimitResponse;

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
      expiresAt: true,
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
  // Lejárat-kapu (2026-08-11, fix): a többi jelölt-útvonal (resend, apply)
  // mintájára — lejárt meghívóra a 2. lépés sem küldhető be örökké.
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "EXPIRED" }, { status: 409 });
  }
  if (!invite.result) {
    return NextResponse.json({ error: "MAIN_ASSESSMENT_MISSING" }, { status: 409 });
  }
  if (invite.result.teamRoleSelections) {
    return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });
  }

  // FELTÉTELES írás (nem check-then-act, 2026-08-11, fix): a „még nincs
  // szerep-válasz" feltétel MAGÁN az UPDATE-en fut — két párhuzamos beküldés
  // közül csak az egyik írhat, a másik 409-et kap (a fenti guard READ
  // COMMITTED alatt mindkettőt átengedte volna).
  const written = await prisma.candidateResult.updateMany({
    where: { id: invite.result.id, teamRoleSelections: { equals: Prisma.AnyNull } },
    data: { teamRoleSelections: selections },
  });
  if (written.count === 0) {
    return NextResponse.json({ error: "ALREADY_USED" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
