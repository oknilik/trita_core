/**
 * Step-release integration env-setup — a teszt-fájl ELSŐ importjának kell
 * lennie (a CRM admin-env-setup mintája). A RESEND_API_KEY kiürítésével a
 * lépés-nyitási email-láb determinisztikusan a hiba-ágra megy — a teszt
 * pont azt őrzi, hogy ez best effort: a release és az in-app értesítés
 * email-hiba mellett is sikeres.
 */

process.env.RESEND_API_KEY = "";

export {};
