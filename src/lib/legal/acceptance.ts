export interface LegalVersionPair {
  platformTermsVersion: string | null;
  privacyNoticeVersion: string | null;
}

export function hasAcceptedLegalVersion(
  accepted: LegalVersionPair,
  required: LegalVersionPair,
): boolean {
  return Boolean(
    required.platformTermsVersion
    && required.privacyNoticeVersion
    && accepted.platformTermsVersion === required.platformTermsVersion
    && accepted.privacyNoticeVersion === required.privacyNoticeVersion,
  );
}

/**
 * A frissen regisztrált user már a kódban publikált legújabb párt fogadta el;
 * egy régebbi, még aktív kampány emiatt nem kényszerítheti vissza elfogadásra.
 */
export function requiresLegalAcceptance(params: {
  accepted: LegalVersionPair;
  activeCampaign: LegalVersionPair | null;
  publishedCurrent: LegalVersionPair;
}): boolean {
  if (!params.activeCampaign) return false;
  return !hasAcceptedLegalVersion(params.accepted, params.activeCampaign)
    && !hasAcceptedLegalVersion(params.accepted, params.publishedCurrent);
}
