export const PLATFORM_TERMS_VERSION = "PFF-2026-08-v1";
export const B2B_TERMS_VERSION = "B2B-2026-08-v1";
export const DPA_VERSION = "DPA-2026-08-v1";
export const PRIVACY_NOTICE_VERSION = "PRIVACY-2026-08-25";
export const LEGAL_EFFECTIVE_DATE = "2026-08-29";

export interface RegistrationLegalAcceptance {
  accepted: true;
  acceptedAt: string;
  platformTermsVersion: typeof PLATFORM_TERMS_VERSION;
  privacyNoticeVersion: typeof PRIVACY_NOTICE_VERSION;
}

export function createRegistrationLegalAcceptance(): RegistrationLegalAcceptance {
  return {
    accepted: true,
    acceptedAt: new Date().toISOString(),
    platformTermsVersion: PLATFORM_TERMS_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
  };
}
