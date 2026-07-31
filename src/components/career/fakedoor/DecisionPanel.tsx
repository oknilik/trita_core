"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import {
  CAREER_PRICE_STEP,
  FAKE_DOOR_OTHER_MAX,
  formatPrice,
  type CareerNoReason,
  type CareerValueGoal,
} from "@/lib/fakedoor/career";

// A mérés lelke: a döntés és az azt követő EGY kérdés.
//
// Fontos tervezési döntés: a döntés (igen/nem) AZONNAL mentődik, a követő
// kérdés külön hívás. Aki a második képernyőn elnavigál, annak a válasza
// akkor is megvan — a legfontosabb jelzést nem veszíthetjük el a legkisebb
// súrlódáson.
//
// A két gomb vizuálisan egyenrangú súlyú. Ha a „nem" halkabb lenne, a minta
// felfelé torzulna, és a mérés önbecsapássá válna.

type Stage = "ask" | "followup" | "done";

export interface DecisionInitialState {
  interest: "yes" | "no";
  valueGoal: CareerValueGoal | null;
  reasonNo: CareerNoReason | null;
  emailOptIn: boolean;
}

interface DecisionPanelProps {
  sessionId: string;
  source: string;
  /**
   * A látogatónak MUTATOTT ár (Ft). Az ár-csúszka innen indul és nulláig
   * megy: a fizetési hajlandóság ehhez az árhoz mérve olvasandó, ezért a
   * csúszka sosem mehet a látott ár fölé.
   */
  priceVariant: number;
  defaultEmail: string | null;
  initial: DecisionInitialState | null;
}

const GOAL_OPTIONS: { value: CareerValueGoal; key: string }[] = [
  { value: "fit", key: "fakeDoor.goalFit" },
  { value: "switch", key: "fakeDoor.goalSwitch" },
  { value: "interview", key: "fakeDoor.goalInterview" },
  { value: "confirm", key: "fakeDoor.goalConfirm" },
  { value: "other", key: "fakeDoor.goalOther" },
];

const REASON_OPTIONS: { value: CareerNoReason; key: string }[] = [
  { value: "price", key: "fakeDoor.reasonPrice" },
  { value: "accuracy", key: "fakeDoor.reasonAccuracy" },
  { value: "no_need", key: "fakeDoor.reasonNoNeed" },
  { value: "other", key: "fakeDoor.reasonOther" },
];

export function DecisionPanel({
  sessionId,
  source,
  priceVariant,
  defaultEmail,
  initial,
}: DecisionPanelProps) {
  const { locale } = useLocale();
  const [stage, setStage] = useState<Stage>(initial ? "done" : "ask");
  const [interest, setInterest] = useState<"yes" | "no" | null>(
    initial?.interest ?? null,
  );
  const [choice, setChoice] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [wantsEmail, setWantsEmail] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [emailSaved, setEmailSaved] = useState(initial?.emailOptIn ?? false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  // Az „drágának tartom" ág csúszkája. A látott árról indul: onnan húzza le
  // a válaszadó oda, ahol már megérné neki.
  const [maxPrice, setMaxPrice] = useState(priceVariant);

  async function send(body: Record<string, unknown>): Promise<boolean> {
    setFailed(false);
    setPending(true);
    try {
      const res = await fetch("/api/career/fakedoor/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, source, ...body }),
      });
      if (!res.ok) throw new Error("SAVE_FAILED");
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      setPending(false);
    }
  }

  async function decide(value: "yes" | "no") {
    if (pending) return;
    const ok = await send({ interest: value });
    if (!ok) return;
    setInterest(value);
    setChoice(null);
    setStage("followup");
  }

  async function submitFollowUp(skipped: boolean) {
    if (pending || !interest) return;

    const selected = skipped ? null : choice;
    // Az „egyéb" szöveg csak akkor kerül el, ha tényleg az „egyéb" a válasz —
    // különben egy ottfelejtett szöveg más opcióhoz ragadna hozzá.
    const freeText = selected === "other" ? otherText.trim().slice(0, FAKE_DOOR_OTHER_MAX) : "";

    // Az összeg csak akkor megy el, ha tényleg az ár a visszatartó ok —
    // különben egy meg sem mozgatott csúszka alapértéke keveredne az adatba.
    const priceAnswer = interest === "no" && selected === "price" ? maxPrice : null;

    const optIn = interest === "yes" && wantsEmail && email.trim().length > 0;
    if (optIn && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);

    const ok = await send({
      interest,
      // Az átugrás is VÁLASZ: enélkül a megoszlás azok felé torzulna, akik
      // hajlandóak voltak még egy kérdésre felelni.
      ...(interest === "yes"
        ? { valueGoal: (selected ?? "skipped") as CareerValueGoal }
        : { reasonNo: (selected ?? "skipped") as CareerNoReason }),
      ...(priceAnswer != null ? { maxPriceHuf: priceAnswer } : {}),
      ...(freeText ? { otherText: freeText } : {}),
      ...(optIn ? { emailOptIn: true, email: email.trim() } : {}),
    });
    if (!ok) return;
    setEmailSaved(optIn);
    setStage("done");
  }

  const optionRow = (
    value: string,
    label: string,
    name: string,
  ) => (
    <label
      key={value}
      className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-4 py-2.5 transition ${
        choice === value
          ? "border-[var(--fd-terracotta)] bg-[var(--fd-terracotta)]/[0.06]"
          : "border-[var(--color-border-soft)] bg-white hover:border-[var(--fd-mustard)]"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={choice === value}
        onChange={() => setChoice(value)}
        className="h-4 w-4 accent-[var(--fd-terracotta)]"
      />
      <span className="text-body text-[var(--color-text-primary)]">{label}</span>
    </label>
  );

  if (stage === "done") {
    return (
      <div>
        <p className="font-fraunces text-[21px] leading-snug text-[var(--fd-deep)] md:text-[25px]">
          {t("fakeDoor.thanksTitle", locale)}
        </p>
        <p className="mt-2 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
          {t("fakeDoor.thanksNote", locale)}
        </p>
        {emailSaved && (
          <p className="mt-1.5 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
            {t("fakeDoor.thanksEmail", locale)}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setStage("ask");
            setInterest(null);
            setChoice(null);
          }}
          className="mt-3 min-h-[44px] text-caption font-medium text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--fd-terracotta)]"
        >
          {t("fakeDoor.changeAnswer", locale)}
        </button>
      </div>
    );
  }

  if (stage === "followup" && interest) {
    const isYes = interest === "yes";
    const options = isYes ? GOAL_OPTIONS : REASON_OPTIONS;
    return (
      <div>
        <p className="font-fraunces text-[21px] leading-snug text-[var(--fd-deep)] md:text-[25px]">
          {t(isYes ? "fakeDoor.goalTitle" : "fakeDoor.reasonTitle", locale)}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {options.map((option) =>
            optionRow(option.value, t(option.key, locale), isYes ? "fd-goal" : "fd-reason"),
          )}
        </div>

        {/* Ár-csúszka: a „drága" önmagában nem termékdöntés. Az összeg az. */}
        {!isYes && choice === "price" && (
          <div className="mt-3 rounded-xl border-[1.5px] border-[var(--fd-mustard)]/50 bg-[var(--fd-cream)] p-4">
            <p className="text-body font-semibold text-[var(--fd-deep)]">
              {t("fakeDoor.priceAskTitle", locale)}
            </p>
            <p className="mt-1 text-caption leading-relaxed text-[var(--color-text-secondary)]">
              {t("fakeDoor.priceAskNote", locale)}
            </p>
            <p className="mt-3 font-fraunces text-[26px] leading-none text-[var(--fd-terracotta)] md:text-[32px]">
              {maxPrice === 0 ? t("fakeDoor.priceZero", locale) : formatPrice(maxPrice, locale)}
            </p>
            <input
              type="range"
              min={0}
              max={priceVariant}
              step={CAREER_PRICE_STEP}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              aria-label={t("fakeDoor.priceAskTitle", locale)}
              className="mt-3 h-11 w-full accent-[var(--fd-terracotta)]"
            />
            <div className="flex justify-between text-micro font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              <span>0 Ft</span>
              <span>{formatPrice(priceVariant, locale)}</span>
            </div>
          </div>
        )}

        {choice === "other" && (
          <input
            type="text"
            value={otherText}
            maxLength={FAKE_DOOR_OTHER_MAX}
            onChange={(event) => setOtherText(event.target.value)}
            placeholder={t("fakeDoor.otherPlaceholder", locale)}
            className="mt-2 min-h-[44px] w-full rounded-xl border-[1.5px] border-[var(--color-border-soft)] px-4 text-body text-[var(--color-text-primary)] outline-none focus:border-[var(--fd-terracotta)]"
          />
        )}

        {isYes && (
          <div className="mt-5 rounded-xl border-[1.5px] border-[var(--fd-mustard)]/50 bg-[var(--fd-cream)] p-4">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={wantsEmail}
                onChange={(event) => setWantsEmail(event.target.checked)}
                className="h-4 w-4 accent-[var(--fd-terracotta)]"
              />
              <span className="text-body font-semibold text-[var(--fd-deep)]">
                {t("fakeDoor.notifyTitle", locale)}
              </span>
            </label>
            {wantsEmail && (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("fakeDoor.emailPlaceholder", locale)}
                  className="mt-2 min-h-[44px] w-full rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-white px-4 text-body text-[var(--color-text-primary)] outline-none focus:border-[var(--fd-terracotta)]"
                />
                <p className="mt-1.5 text-caption text-[var(--color-text-secondary)]">
                  {t("fakeDoor.notifyNote", locale)}
                </p>
                {emailInvalid && (
                  <p className="mt-1 text-caption text-[var(--fd-terracotta)]">
                    {t("fakeDoor.emailInvalid", locale)}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => void submitFollowUp(false)}
            disabled={pending}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[var(--fd-terracotta)] px-7 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60 sm:flex-1"
          >
            {t("fakeDoor.submit", locale)}
          </button>
          {/* Az átugrás nem büntetett út: ha rontaná a konverziót, a döntés
              maga is kevesebb lenne — de az átugrás ténye rögzül. */}
          <button
            type="button"
            onClick={() => void submitFollowUp(true)}
            disabled={pending}
            className="min-h-[44px] text-caption font-medium text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--fd-terracotta)] disabled:opacity-60"
          >
            {t("fakeDoor.skip", locale)}
          </button>
        </div>

        {failed && (
          <p className="mt-3 text-caption text-[var(--fd-terracotta)]">
            {t("fakeDoor.error", locale)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="font-fraunces text-[22px] leading-snug text-[var(--fd-deep)] md:text-[26px]">
        {t("fakeDoor.askTitle", locale)}
      </p>
      <p className="mt-2 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
        {t("fakeDoor.askNote", locale)}
      </p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => void decide("yes")}
          disabled={pending}
          className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[var(--fd-terracotta)] px-6 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
        >
          {t("fakeDoor.yes", locale)}
        </button>
        {/* Vonalas, de azonos méretű és súlyú: a „nem" ugyanolyan hasznos
            válasz — ha halkabb lenne, a minta felfelé torzulna. */}
        <button
          type="button"
          onClick={() => void decide("no")}
          disabled={pending}
          className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border-[1.5px] border-[var(--fd-deep)] bg-transparent px-6 text-sm font-semibold text-[var(--fd-deep)] transition hover:bg-[var(--fd-deep)]/[0.06] disabled:opacity-60"
        >
          {t("fakeDoor.no", locale)}
        </button>
      </div>
      {failed && (
        <p className="mt-3 text-caption text-[var(--fd-terracotta)]">
          {t("fakeDoor.error", locale)}
        </p>
      )}
    </div>
  );
}
