export interface ServerAuthResult {
  userId: string | null;
}

export async function getServerAuth(): Promise<ServerAuthResult> {
  const { auth } = await import("@clerk/nextjs/server");
  const result = await auth();
  return { userId: result.userId ?? null };
}

