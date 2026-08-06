// ─────────────────────────────────────────────────────────────────────
// CRM service — publikus felület. Az API-route-ok és szerver-komponensek
// INNEN importálnak, nem a belső modulokból (a notification hub index-
// mintáját követve). Pure konstansok/guardok: constants.ts / guards.ts.
// ─────────────────────────────────────────────────────────────────────

export { CrmServiceError, isCrmNotFoundCode, type CrmErrorCode } from "./errors";

export {
  logActivity,
  updateActivity,
  deleteActivity,
  type LogActivityEntry,
  type NextActionUpdate,
} from "./activity-log";

export { attachInquiryToOpenDeal, type AutoAttachResult } from "./auto-attach";

export {
  listDeals,
  getDueDeals,
  getIntakeInquiries,
  getDealDetail,
  getPipelineSnapshot,
  createDeal,
  createDealFromInquiry,
  updateDealDetails,
  setDealNote,
  setNextAction,
  clearNextAction,
  setDealStage,
  closeDeal,
  reopenDeal,
  handleOrgAccessGranted,
  type ListDealsFilter,
  type CreateDealInput,
  type DealDetailsPatch,
  type CloseDealParams,
  type OrgAccessAction,
  type OrgAccessGrantedResult,
} from "./deals";

export {
  createQuote,
  updateDraftQuoteInput,
  markQuoteSent,
  markQuoteAccepted,
  markQuoteDeclined,
  expireQuote,
  setQuoteValidUntil,
  duplicateQuote,
  deleteDraftQuote,
  type CreateQuoteParams,
} from "./quotes";
