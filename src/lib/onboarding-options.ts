export const GENDER_OPTIONS = [
  { value: "male", labelKey: "onboarding.genderMale" },
  { value: "female", labelKey: "onboarding.genderFemale" },
  { value: "other", labelKey: "onboarding.genderOther" },
  { value: "prefer_not_to_say", labelKey: "onboarding.genderPreferNot" },
] as const;

export const EDUCATION_OPTIONS = [
  { value: "primary", labelKey: "onboarding.educationPrimary" },
  { value: "secondary", labelKey: "onboarding.educationSecondary" },
  { value: "bachelor", labelKey: "onboarding.educationBachelor" },
  { value: "master", labelKey: "onboarding.educationMaster" },
  { value: "doctorate", labelKey: "onboarding.educationDoctorate" },
  { value: "other", labelKey: "onboarding.educationOther" },
] as const;

export const OCCUPATION_STATUS_VALUES = [
  "working",
  "studying",
  "working_and_studying",
  "neither",
  "unemployed",
  "prefer_not_to_say",
] as const;

export const WORK_SCHEDULE_VALUES = [
  "full_time",
  "part_time",
  "contractor",
  "other",
] as const;

export const COMPANY_SIZE_VALUES = [
  "micro_1_9",
  "small_10_49",
  "medium_50_249",
  "large_250_999",
  "enterprise_1000_plus",
  "not_sure",
] as const;

export const STUDY_LEVEL_VALUES = [
  "secondary_school",
  "bachelor",
  "master",
  "doctoral",
  "other",
] as const;

export const UNEMPLOYMENT_DURATION_VALUES = [
  "0_3_months",
  "3_12_months",
  "1_plus_year",
] as const;

export const OCCUPATION_STATUS_OPTIONS = [
  { value: "working", labelKey: "onboarding.occupationStatusWorking" },
  { value: "studying", labelKey: "onboarding.occupationStatusStudying" },
  {
    value: "working_and_studying",
    labelKey: "onboarding.occupationStatusWorkingAndStudying",
  },
  { value: "neither", labelKey: "onboarding.occupationStatusNeither" },
  { value: "unemployed", labelKey: "onboarding.occupationStatusUnemployed" },
  {
    value: "prefer_not_to_say",
    labelKey: "onboarding.occupationStatusPreferNotToSay",
  },
] as const;

export const WORK_SCHEDULE_OPTIONS = [
  { value: "full_time", labelKey: "onboarding.workScheduleFullTime" },
  { value: "part_time", labelKey: "onboarding.workSchedulePartTime" },
  { value: "contractor", labelKey: "onboarding.workScheduleContractor" },
  { value: "other", labelKey: "onboarding.workScheduleOther" },
] as const;

export const COMPANY_SIZE_OPTIONS = [
  { value: "micro_1_9", labelKey: "onboarding.companySizeMicro" },
  { value: "small_10_49", labelKey: "onboarding.companySizeSmall" },
  { value: "medium_50_249", labelKey: "onboarding.companySizeMedium" },
  { value: "large_250_999", labelKey: "onboarding.companySizeLarge" },
  {
    value: "enterprise_1000_plus",
    labelKey: "onboarding.companySizeEnterprise",
  },
  { value: "not_sure", labelKey: "onboarding.companySizeNotSure" },
] as const;

export const STUDY_LEVEL_OPTIONS = [
  {
    value: "secondary_school",
    labelKey: "onboarding.studyLevelSecondarySchool",
  },
  { value: "bachelor", labelKey: "onboarding.studyLevelBachelor" },
  { value: "master", labelKey: "onboarding.studyLevelMaster" },
  { value: "doctoral", labelKey: "onboarding.studyLevelDoctoral" },
  { value: "other", labelKey: "onboarding.studyLevelOther" },
] as const;

export const UNEMPLOYMENT_DURATION_OPTIONS = [
  { value: "0_3_months", labelKey: "onboarding.unemploymentDuration0To3" },
  { value: "3_12_months", labelKey: "onboarding.unemploymentDuration3To12" },
  { value: "1_plus_year", labelKey: "onboarding.unemploymentDuration1Plus" },
] as const;

export type OccupationStatus = (typeof OCCUPATION_STATUS_VALUES)[number];
export type WorkSchedule = (typeof WORK_SCHEDULE_VALUES)[number];
export type CompanySize = (typeof COMPANY_SIZE_VALUES)[number];
export type StudyLevel = (typeof STUDY_LEVEL_VALUES)[number];
export type UnemploymentDuration =
  (typeof UNEMPLOYMENT_DURATION_VALUES)[number];

export function requiresWorkFields(status: OccupationStatus): boolean {
  return status === "working" || status === "working_and_studying";
}

export function requiresStudyLevel(status: OccupationStatus): boolean {
  return status === "studying" || status === "working_and_studying";
}

export function requiresUnemploymentDuration(status: OccupationStatus): boolean {
  return status === "unemployed";
}
