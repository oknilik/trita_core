import type { TestType } from "@prisma/client";
import { prisma } from "./prisma";

// Egyetlen aktív instrumentum: TRITAN (TSFI kérdésbank) — a korábbi
// kutatási-fázisú randomizált kiosztás 2026-07-16-án kivezetve.
const DEFAULT_TEST_TYPE: TestType = "TRITAN";

export async function assignTestType(userProfileId: string): Promise<TestType> {
  await prisma.userProfile.update({
    where: { id: userProfileId },
    data: {
      testType: DEFAULT_TEST_TYPE,
      testTypeAssignedAt: new Date(),
    },
  });

  return DEFAULT_TEST_TYPE;
}
