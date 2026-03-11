import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/manager/output/[cacheKey] — cached output lookup
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cacheKey: string }> }
) {
  const { cacheKey } = await params;

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!manager || manager.role !== "MANAGER") {
    return NextResponse.json({ error: "NOT_A_MANAGER" }, { status: 403 });
  }

  const output = await prisma.generatedOutput.findUnique({
    where: { cacheKey },
    select: {
      id: true,
      cacheKey: true,
      content: true,
      model: true,
      hitCount: true,
      createdAt: true,
      managerId: true,
    },
  });

  if (!output) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Only the coach who generated it (or any coach — business decision: shared cache)
  // For now: any authenticated coach can access cached outputs (cache is by profile shape, not coach identity)

  return NextResponse.json({
    cacheKey: output.cacheKey,
    content: output.content,
    model: output.model,
    hitCount: output.hitCount,
    createdAt: output.createdAt,
  });
}
