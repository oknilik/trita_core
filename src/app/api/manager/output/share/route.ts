import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

const schema = z.object({
  cacheKey: z.string().min(1),
});

// POST /api/manager/output/share — generate or return existing shareToken for a debrief
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!profile || profile.role !== "MANAGER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const output = await prisma.generatedOutput.findUnique({
    where: { cacheKey: body.data.cacheKey },
    select: { id: true, shareToken: true, managerId: true },
  });

  if (!output) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Only the manager who generated the output can share it
  // (outputs with managerId=null are pre-generated templates, not shareable via this endpoint)
  if (!output.managerId || output.managerId !== profile.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Return existing token or generate a new one
  const shareToken = output.shareToken ?? randomBytes(20).toString("hex");

  if (!output.shareToken) {
    await prisma.generatedOutput.update({
      where: { id: output.id },
      data: { shareToken },
    });
  }

  return NextResponse.json({ shareToken });
}
