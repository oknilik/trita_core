import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendCandidateInviteEmail } from "@/lib/emails";
import {
  CandidateApplyServiceError,
  createCandidateApplyInvite,
} from "@/lib/candidate-apply/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";

const bodySchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100),
  position: z.string().max(100).optional(),
  // A hiring lap orgja — a meghívó kimondott hatóköre (2026-08-11): a
  // service EZ alá iktat, és a hívó szerepét ebben az orgban ellenőrzi.
  orgId: z.string().optional(),
  teamId: z.string().optional(),
  includeTeamRole: z.boolean().optional(),
  inviteLocale: z.enum(["hu", "en"]).optional(),
});

// POST /api/manager/candidates — create a candidate invite link (+ optionally send email)
export async function POST(req: Request) {
  // E-mailt küldő végpont — rate limit a testvér-route-ok mintájára.
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { email, name, position, orgId, teamId, includeTeamRole, inviteLocale } = parsed.data;
  let serviceResult;
  try {
    serviceResult = await createCandidateApplyInvite({
      clerkId: userId,
      email,
      name,
      position,
      orgId,
      teamId,
      includeTeamRole,
    });
  } catch (error) {
    if (error instanceof CandidateApplyServiceError) {
      return NextResponse.json(
        {
          error: error.code,
          ...(error.details ?? {}),
        },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  // Send email if address was provided
  let emailSent = false;
  if (email) {
    const managerName = serviceResult.manager.username ?? serviceResult.manager.email ?? "Manager";
    emailSent = await sendCandidateInviteEmail({
      to: email,
      managerName,
      token: serviceResult.invite.token,
      position: position ?? undefined,
      applyUrl: `${APP_URL}/apply/${serviceResult.invite.token}`,
      locale: inviteLocale,
    });
  }

  return NextResponse.json({ invite: serviceResult.invite, emailSent }, { status: 201 });
}
