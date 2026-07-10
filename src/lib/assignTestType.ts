import type { TestType } from "@prisma/client";
import { prisma } from "./prisma";

// Product mode: every new user gets the same instrument. HEXACO is the
// reference-standard question bank and the team-intelligence layer is
// built on its dimensions. (The earlier research-phase random assignment
// across HEXACO / HEXACO_MODIFIED / BIG_FIVE is retired; existing users
// keep their originally assigned type and results.)
const DEFAULT_TEST_TYPE: TestType = "HEXACO";

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
