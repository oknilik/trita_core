import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/candidate/[token] — validate token and return invite info
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await prisma.candidateInvite.findUnique({
    where: { token },
    select: {
      id: true,
      testType: true,
      position: true,
      name: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  }

  if (invite.status === "COMPLETED") {
    return NextResponse.json({ error: "ALREADY_USED", status: "COMPLETED" }, { status: 410 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "INVITE_EXPIRED", status: "EXPIRED" }, { status: 410 });
  }

  return NextResponse.json({
    testType: invite.testType,
    position: invite.position,
    candidateName: invite.name,
    status: invite.status,
    expiresAt: invite.expiresAt,
  });
}
