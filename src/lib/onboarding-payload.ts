import { z } from "zod";

const GENDERS = ["male", "female", "other", "prefer_not_to_say"] as const;

/**
 * Az onboarding két legitim bemeneti módot kezel:
 *
 * - teljes profil: a hagyományos regisztráció demográfiai adatokkal;
 * - gyors aktiválás: a vendégmérés után csak név + hozzájárulás.
 *
 * A demográfiai pár vagy együtt érkezik, vagy egyik sem. Így az API nem
 * enged véletlenül félbemaradt teljes onboardingot, de a nullable Prisma-
 * mezőkre építve külön migráció nélkül támogatja a progresszív profilozást.
 */
export function buildOnboardingSchema(currentYear = new Date().getFullYear()) {
  return z
    .object({
      username: z.string().min(2).max(20),
      birthYear: z
        .number()
        .int()
        .min(currentYear - 100)
        .max(currentYear - 16)
        .optional(),
      gender: z.enum(GENDERS).optional(),
      country: z.string().min(1).max(100).optional(),
      consentedAt: z.string().datetime().optional(),
      eduLevel: z.enum(["primary", "secondary", "vocational", "higher", "specialized"]).nullable().optional(),
      eduField: z
        .enum([
          "tech_engineering",
          "economics",
          "health",
          "humanities",
          "natural_science",
          "legal",
          "arts",
          "pedagogy",
          "trade",
          "none",
          "none_other",
        ])
        .nullable()
        .optional(),
      currentIndustry: z.string().max(50).nullable().optional(),
    })
    .superRefine((data, ctx) => {
      const hasBirthYear = data.birthYear !== undefined;
      const hasGender = data.gender !== undefined;
      if (hasBirthYear === hasGender) return;

      ctx.addIssue({
        code: "custom",
        path: hasBirthYear ? ["gender"] : ["birthYear"],
        message: "Birth year and gender must be provided together",
      });
    });
}

export const onboardingSchema = buildOnboardingSchema();
export type OnboardingPayload = z.infer<typeof onboardingSchema>;
