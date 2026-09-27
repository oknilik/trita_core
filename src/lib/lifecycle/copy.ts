import type { PersonalRule } from "./rules";
import { t, tf, type Locale } from "@/lib/i18n";
import { lifecycleTranslations } from "@/lib/i18n/lifecycle";
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "@/lib/anonymity";

type CopyRule = PersonalRule | "REFLECTION";
type FollowupCopy = { title: string; body: string; cta: string };
function message(rule: CopyRule, locale: Locale): FollowupCopy {
  return {
    title: t(`lifecycle.messages.${rule}.title`, locale),
    body: tf(`lifecycle.messages.${rule}.body`, locale, { min: MIN_RATERS_FOR_ANONYMOUS_AGGREGATE }),
    cta: t(`lifecycle.messages.${rule}.cta`, locale),
  };
}
function localizedMessage(rule: CopyRule): Record<Locale, FollowupCopy> {
  return { hu: message(rule, "hu"), en: message(rule, "en") };
}
export const FOLLOWUP_COPY: Record<CopyRule, Record<Locale, FollowupCopy>> = {
  START_SELF: localizedMessage("START_SELF"),
  RESUME_SELF: localizedMessage("RESUME_SELF"),
  INVITE_FIRST_OBSERVERS: localizedMessage("INVITE_FIRST_OBSERVERS"),
  REFLECTION: localizedMessage("REFLECTION"),
};

// Az adminfelület magyar; a kódok megmaradnak az API-ban és a naplóban.
function adminLabels(group: "reasons" | "rules" | "states" | "modes"): Record<string, string> {
  return Object.fromEntries(Object.keys(lifecycleTranslations.lifecycle[group])
    .map(code => [code, t(`lifecycle.${group}.${code}`, "hu")]));
}
export const REASONS = adminLabels("reasons");
export const RULE_LABELS = adminLabels("rules");
export const DELIVERY_LABELS = adminLabels("states");
export const MODE_LABELS = adminLabels("modes");
