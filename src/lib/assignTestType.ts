import type { TestType } from "@prisma/client";
import { prisma } from "./prisma";
import { CORE_TEST_TYPES, EXPLORATORY_TEST_TYPES, CORE_QUOTA } from "./questions";

/**
 * Priority-balanced random assignment.
 *
 * 1. Core types (HEXACO, HEXACO_MODIFIED, BIG_FIVE) are filled first.
 *    While any core type is below CORE_QUOTA, new users only get core types.
 * 2. Once every core type reaches CORE_QUOTA, exploratory types (MBTI) join the pool.
 * 3. Within each pool, the type with the fewest participants is chosen (balanced).
 *    Ties are broken randomly.
 */
export async function assignTestType(userProfileId: string): Promise<TestType> {
  // Count current assignments per type
  const counts = await prisma.userProfile.groupBy({
    by: ["testType"],
    where: {
      testType: { not: null },
      deleted: false,
    },
    _count: true,
  });

  const countMap = new Map<TestType, number>();
  for (const t of [...CORE_TEST_TYPES, ...EXPLORATORY_TEST_TYPES]) {
    countMap.set(t, 0);
  }
  for (const row of counts) {
    if (row.testType) {
      countMap.set(row.testType, row._count);
    }
  }

  // Determine whether all core types have reached quota
  const allCoreAtQuota = CORE_TEST_TYPES.every(
    (t) => (countMap.get(t) ?? 0) >= CORE_QUOTA,
  );

  // Pick the candidate pool
  const pool: TestType[] = allCoreAtQuota
    ? [...CORE_TEST_TYPES, ...EXPLORATORY_TEST_TYPES]
    : [...CORE_TEST_TYPES];

  // Find the minimum count within the pool
  const minCount = Math.min(...pool.map((t) => countMap.get(t) ?? 0));

  // Get all types with the minimum count
  const candidates = pool.filter((t) => (countMap.get(t) ?? 0) === minCount);

  // Pick randomly among candidates
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Assign to user
  await prisma.userProfile.update({
    where: { id: userProfileId },
    data: {
      testType: chosen,
      testTypeAssignedAt: new Date(),
    },
  });

  return chosen;
}
