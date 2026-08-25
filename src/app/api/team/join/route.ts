import { NextResponse } from "next/server";
import { z } from "zod";
import {
  joinMembershipFromInvite,
  MembershipOnboardingError,
} from "@/lib/membership-onboarding/server";
import { getServerAuth } from "@/lib/auth-server";

const schema = z.object({ inviteId: z.string().min(1) });

// POST /api/team/join — add authenticated user to team + org via invite token
export async function POST(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const result = await joinMembershipFromInvite({
      clerkId: userId,
      kind: "team",
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
