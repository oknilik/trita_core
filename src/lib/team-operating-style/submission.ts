import { z } from "zod";
import { AnswerSchema, type OperatingAnswers } from "./scoring";
import { ITEMS, OPERATING_STYLE_VERSION } from "./questions";

export const OperatingSubmissionSchema = z.object({
  campaignId: z.string().min(1),
  instrumentVersion: z.literal(OPERATING_STYLE_VERSION),
  intent: z.enum(["draft", "submit"]),
  answers: AnswerSchema,
}).strict().superRefine((body, ctx) => {
  if (body.intent === "submit" && ITEMS.some((q) => !Object.hasOwn(body.answers, q.id))) {
    ctx.addIssue({ code: "custom", message: "INCOMPLETE_ANSWERS" });
  }
});
export function sameOperatingAnswers(a: unknown, b: OperatingAnswers): boolean {
  const parsed = AnswerSchema.safeParse(a);
  return parsed.success && ITEMS.every((q) => parsed.data[q.id] === b[q.id]);
}
export class OperatingError extends Error {
  constructor(public code: string, public status = 409) { super(code); }
}
