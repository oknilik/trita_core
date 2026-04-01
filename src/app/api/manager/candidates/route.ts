import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendCandidateInviteEmail } from "@/lib/emails";
import {
  CandidateApplyServiceError,
  createCandidateApplyInvite,
} from "@/lib/candidate-apply/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

const bodySchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100),
  position: z.string().max(100).optional(),
  teamId: z.string().optional(),
  inviteLocale: z.enum(["hu", "en"]).optional(),
});

// POST /api/manager/candidates — create a candidate invite link (+ optionally send email)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { email, name, position, teamId, inviteLocale } = parsed.data;
  let serviceResult;
  try {
    serviceResult = await createCandidateApplyInvite({
      clerkId: userId,
      email,
      name,
      position,
      teamId,
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
