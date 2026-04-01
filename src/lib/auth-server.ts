import { cookies } from "next/headers";

export interface ServerAuthResult {
  userId: string | null;
}

const E2E_USER_COOKIE_NAME = "trita_e2e_user_id";

async function readE2EBypassUserId(): Promise<string | null> {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.TRITA_E2E_AUTH_BYPASS !== "1") return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(E2E_USER_COOKIE_NAME)?.value?.trim();
  return raw ? raw : null;
}

export async function getServerAuth(): Promise<ServerAuthResult> {
  const bypassUserId = await readE2EBypassUserId();
  if (bypassUserId) return { userId: bypassUserId };

  const { auth } = await import("@clerk/nextjs/server");
  const result = await auth();
  return { userId: result.userId ?? null };
}
