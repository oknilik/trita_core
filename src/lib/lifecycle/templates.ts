import { APP_URL, buildEmailLayout, EMAIL_P, escapeHtml, renderCtaButton } from "@/lib/email-layout";
import { normalizeLocale, t } from "@/lib/i18n";
import { FOLLOWUP_COPY } from "./copy";
import type { PersonalRule } from "./rules";
import type { PreparedEmail } from "./delivery";

export function prepareFollowupEmail(params: { rule: PersonalRule | "REFLECTION"; locale: string | null; opportunityId?: string; unsubscribeToken: string }): PreparedEmail {
  const locale = normalizeLocale(params.locale);
  const copy = FOLLOWUP_COPY[params.rule][locale];
  const ctaUrl = params.opportunityId
    ? `${APP_URL}/api/lifecycle/continue?id=${encodeURIComponent(params.opportunityId)}`
    : `${APP_URL}/interaction`;
  const preferences = params.opportunityId ? `${APP_URL}/profile/follow-up/${encodeURIComponent(params.opportunityId)}` : `${APP_URL}/email-preferences`;
  const unsubscribeUrl = `${APP_URL}/follow-up/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`;
  const unsubscribeApi = `${APP_URL}/api/lifecycle/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`;
  const label = t("lifecycle.email.unsubscribe", locale);
  const manageLabel = t(params.opportunityId ? "lifecycle.email.manage" : "lifecycle.email.preferences", locale);
  return {
    subject: copy.title,
    html: buildEmailLayout({ locale, kind: t("lifecycle.email.kind", locale),
      eyebrow: "trita", heading: copy.title, preheader: copy.body,
      bodyContent: `<p style="${EMAIL_P}">${escapeHtml(copy.body)}</p>${renderCtaButton({ href: ctaUrl, label: copy.cta })}<p style="${EMAIL_P}"><a href="${preferences}">${manageLabel}</a></p>`,
      optOut: { href: unsubscribeUrl, label },
      signOff: { thanks: t("lifecycle.email.signOff", locale), team: t("lifecycle.email.signature", locale) },
    }),
    text: `${copy.body}\n\n${copy.cta}: ${ctaUrl}\n\n${manageLabel}: ${preferences}\n\n${label}: ${unsubscribeUrl}`,
    headers: { "List-Unsubscribe": `<${unsubscribeApi}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}
