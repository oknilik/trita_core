/**
 * Levél-minták — MINDEN kimenő sablon, mindkét nyelven, a VALÓDI küldő-úton.
 *
 * Két fogyasztója van, és ez a lényeg: az előnézet-generátor
 * (`scripts/preview-emails.ts`) és a guardrail-teszt
 * (`tests/unit/design/email-templates.test.ts`) UGYANEZT a listát dolgozza fel.
 * Amit szemmel ellenőrzöl, azt ellenőrzi a CI is — és ha új sablon kerül a
 * rendszerbe, egyetlen helyre kell felvenni.
 *
 * MIÉRT A VALÓDI KÜLDŐ-ÚT, ÉS NEM KÉZZEL ÍRT MINTÁK:
 * a korábbi előnézet-script saját, kézzel másolt HTML-eket rakott össze, ezért
 * folyamatosan szétcsúszott a valósággal (12 mintát ismert a 21-ből, csak
 * magyarul, és a törzsszövegek már nem egyeztek). Itt a küldő függvényeket
 * hívjuk, a Resend HTTP-hívását pedig elkapjuk: a tárgy, a HTML és a
 * sima szöveges változat is az, ami élesben kimenne.
 */

export type EmailSample = {
  /** Sablon-azonosító — a log `template` mezőjével egyezik. */
  id: string;
  locale: "hu" | "en";
  subject: string;
  html: string;
  text: string;
  /** A levéllel utazó inline képek (szójel, formanyelvi jel, QR). */
  attachments: CapturedAttachment[];
};

type CapturedAttachment = {
  filename?: string;
  content?: string;
  content_type?: string;
  content_id?: string;
};

type CapturedPayload = {
  subject?: string;
  html?: string;
  text?: string;
  attachments?: CapturedAttachment[];
};

/**
 * A Resend kliens `fetch`-en megy; küldés helyett elkapjuk a kérést, és a
 * törzséből olvassuk ki a levelet. Így nincs szükség hálózatra, kulcsra vagy
 * a küldő-függvények megbontására.
 */
export async function withCapturedSend<T>(run: () => Promise<T>): Promise<CapturedPayload> {
  const originalFetch = globalThis.fetch;
  let captured: CapturedPayload = {};

  globalThis.fetch = (async (_input: unknown, init?: { body?: unknown }) => {
    if (typeof init?.body === "string") {
      captured = JSON.parse(init.body) as CapturedPayload;
    }
    return new Response(JSON.stringify({ id: "preview" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof globalThis.fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
  return captured;
}

/**
 * Nyelv: a minták EXPLICIT locale-lal futnak, hogy mindkét nyelv rendereljen.
 * A küldők ALAPÉRTELMEZÉSÉT (locale nélküli hívás → magyar) a guardrail külön
 * eseteként ellenőrizzük — az volt a 2026-08-19-i angol-nyelvű hiba oka.
 */

/** 1×1 png — a profil-megosztó QR-ágának bekapcsolásához elég. */
const STUB_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export async function renderEmailSamples(): Promise<EmailSample[]> {
  // A kulcs jelenléte kell a kliens példányosításához; hálózatra nem megy.
  process.env.RESEND_API_KEY ??= "preview-no-network";

  // Dinamikus import: a hívó a modul betöltése ELŐTT állíthatja a
  // NEXT_PUBLIC_APP_URL-t (az előnézet helyi eszköz-útvonalakat kér).
  const m = await import("../src/lib/emails");

  const locales = ["hu", "en"] as const;
  const samples: EmailSample[] = [];

  async function capture(
    id: string,
    locale: "hu" | "en",
    run: () => Promise<unknown>,
  ) {
    const payload = await withCapturedSend(run);
    if (!payload.html || !payload.subject) {
      throw new Error(`A(z) "${id}" (${locale}) minta nem adott levelet`);
    }
    samples.push({
      id,
      locale,
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? "",
      attachments: payload.attachments ?? [],
    });
  }

  for (const locale of locales) {
    await capture("observer_invite", locale, () =>
      m.sendObserverInviteEmail({
        to: "nezopont@example.com",
        inviterName: "Nagy Kata",
        recipientName: "Barátom",
        token: "obs-token",
        locale,
      }),
    );

    await capture("observer_completion", locale, () =>
      m.sendObserverCompletionEmail({ to: "kata@example.com", inviterName: "Kata", locale }),
    );

    await capture("candidate_completed", locale, () =>
      m.sendCandidateCompletedEmail({
        to: "vezeto@example.com",
        candidateName: "Kovács Péter",
        position: "Backend fejlesztő",
        resultUrl: "https://trita.io/hiring/org-1/candidates/inv-1",
        locale,
      }),
    );

    await capture("profile_share", locale, () =>
      m.sendProfileShareEmail({
        to: "kolleg@example.com",
        senderName: "Nagy Kata",
        token: "share-token",
        qrPng: STUB_PNG,
        locale,
      }),
    );

    await capture("reflection_prompt", locale, () =>
      m.sendReflectionPromptEmail({ to: "user@example.com", dimLabel: "Lelkiismeretesség", locale }),
    );

    await capture("compare_invite", locale, () =>
      m.sendCompareInviteEmail({
        to: "masik@example.com",
        senderName: "Nagy Kata",
        token: "cmp-token",
        locale,
      }),
    );

    await capture("verification_code", locale, () =>
      m.sendVerificationCodeEmail({
        to: "user@example.com",
        code: "482913",
        ttlSeconds: 600,
        context: "signUp",
        locale,
      }),
    );

    await capture("sign_in_code", locale, () =>
      m.sendVerificationCodeEmail({
        to: "user@example.com",
        code: "704255",
        ttlSeconds: 600,
        context: "signIn",
        locale,
      }),
    );

    await capture("magic_link", locale, () =>
      m.sendMagicLinkEmail({
        to: "user@example.com",
        magicLinkUrl: "https://trita.io/sign-in?token=magic",
        locale,
      }),
    );

    await capture("draft_reminder", locale, () =>
      m.sendAssessmentDraftReminderEmail({
        to: "user@example.com",
        name: "Anna",
        testName: "TSFI-S",
        answeredCount: 41,
        totalCount: 60,
        locale,
      }),
    );

    await capture("candidate_invite", locale, () =>
      m.sendCandidateInviteEmail({
        to: "jelolt@example.com",
        managerName: "Szabó Márk",
        token: "cand-token",
        position: "Termékmenedzser",
        applyUrl: "https://trita.io/apply/cand-token",
        locale,
      }),
    );

    await capture("team_invite", locale, () =>
      m.sendTeamInviteEmail({
        to: "uj@example.com",
        teamName: "Termék csapat",
        signUpUrl: "https://trita.io/join/team-token",
        locale,
      }),
    );

    await capture("org_invite", locale, () =>
      m.sendOrgInviteEmail({
        to: "uj@example.com",
        orgName: "Banán Kft.",
        role: "ORG_MEMBER",
        signUpUrl: "https://trita.io/join/org/inv-1",
        locale,
      }),
    );

    await capture("consultant_invite", locale, () =>
      m.sendConsultantInviteEmail({ to: "tanacsado@example.com", hasAccount: false, locale }),
    );

    await capture("measurement_step_opened", locale, () =>
      m.sendMeasurementStepEmail({
        to: "tag@example.com",
        campaignName: "Őszi mérési kör",
        link: "/assessment?campaign=c1",
        variant: "opened",
        locale,
      }),
    );

    await capture("measurement_step_reminder", locale, () =>
      m.sendMeasurementStepEmail({
        to: "tag@example.com",
        campaignName: "Őszi mérési kör",
        link: "/assessment?campaign=c1",
        variant: "reminder",
        locale,
      }),
    );

    await capture("welcome", locale, () =>
      m.sendWelcomeEmail({ to: "uj@example.com", locale }),
    );

    await capture("team_report_published", locale, () =>
      m.sendTeamReportPublishedEmail({
        to: "tag@example.com",
        teamName: "Termék csapat",
        teamId: "team-1",
        locale,
      }),
    );

    await capture("pilot_apply_confirmation", locale, () =>
      m.sendPilotApplyConfirmationEmail({ to: "erdeklodo@example.com", name: "Tóth Anna", locale }),
    );

    await capture("advisory_confirmation", locale, () =>
      m.sendAdvisoryConfirmationEmail({ to: "erdeklodo@example.com", name: "Tóth Anna", locale }),
    );
  }

  // Admin-értesítő: csak magyarul megy (a szervezet adminisztrátorának).
  await capture("hiring_credits_request", "hu", () =>
    m.sendHiringCreditsRequestEmail({
      to: "admin@example.com",
      requesterName: "Szabó Márk",
      orgName: "Banán Kft.",
      orgId: "org-1",
    }),
  );

  return samples;
}
