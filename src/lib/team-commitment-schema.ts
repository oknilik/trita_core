import { z } from "zod";

export const commitmentStatusSchema = z.enum(["not_started", "in_progress", "blocked", "done"]);

/** Calendar days stay timezone-free; a matching shape alone accepts February 31. */
export const commitmentDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});

export const commitmentFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  nextStep: z.string().trim().max(2000),
  successCriteria: z.string().trim().max(2000),
  ownerUserId: z.string().min(1).max(191).nullable(),
  dueDate: commitmentDateSchema.nullable(),
}).strict();

export const commitmentMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), fields: commitmentFieldsSchema }).strict(),
  z.object({
    action: z.literal("import"),
    items: z.array(z.object({
      reportId: z.string().min(1).max(191),
      sourceActionKey: z.string().min(1).max(256),
    }).strict()).min(1).max(20),
  }).strict(),
]);

export const commitmentPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    id: z.string().min(1).max(191),
    expectedVersion: z.number().int().positive(),
    status: commitmentStatusSchema,
    note: z.string().trim().max(2000),
  }).strict(),
  z.object({
    action: z.literal("edit"),
    id: z.string().min(1).max(191),
    expectedVersion: z.number().int().positive(),
    fields: commitmentFieldsSchema,
  }).strict(),
  z.object({
    action: z.literal("plan"),
    expectedVersion: z.number().int().nonnegative(),
    focus: z.string().trim().max(2000),
    nextCheckInDate: commitmentDateSchema.nullable(),
  }).strict(),
]);
