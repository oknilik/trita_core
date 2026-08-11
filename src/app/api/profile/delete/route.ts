import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { scrubProfileData } from "@/lib/account-scrub";

const deleteSchema = z.object({
  confirm: z.literal("DELETE"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true },
  });

  if (profile) {
    // A teljes GDPR-scrub a közös forrásból (a Clerk-webhook ugyanezt hívja).
    await scrubProfileData(profile.id, profile.email);
  }

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
