import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MembershipOnboardingError,
  switchMembershipContextFromInvite,
} from "@/lib/membership-onboarding/server";

const schema = z.object({
  inviteId: z.string().min(1),
});

// POST /api/org/switch — non-destructive org context switch via team invite
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const result = await switchMembershipContextFromInvite({
      clerkId: userId,
      inviteId: body.data.inviteId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MembershipOnboardingError) {
      return NextResponse.json(
        { error: error.code, ...(error.details ? { details: error.details } : {}) },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
}
