// Inquiry téma-címkék — függőség-mentes modulban, hogy a CRM (deal-cím
// inquiry-ből) is használhassa a lib/inquiries import-lánca (auth →
// next/navigation) nélkül. A lib/inquiries változatlanul re-exportálja.

export const INQUIRY_TOPIC_LABELS: Record<string, string> = {
  demo: "Demó igény",
  pricing: "Árazás",
  support: "Terméktámogatás",
  partnership: "Partnerség",
  question: "Felhasználói kérdés",
  other: "Egyéb",
};
