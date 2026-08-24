"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { TextField } from "@/components/ui/primitives/TextField";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SuccessCheck } from "@/components/ui/primitives/SuccessCheck";
import { track } from "@/lib/analytics/client";

/**
 * Hírlevél / blog-feliratkozás űrlap.
 *
 * EGY komponens, három megjelenés — mert a szöveg, a validáció és a
 * hibakezelés mindenhol ugyanaz, csak a keret más:
 *   · `panel`   — teljes kártya (blog-lista alja, cikk vége)
 *   · `inline`  — cím + egysoros mező (lábléc)
 *   · `compact` — szűk oszlop (cikk-oldalsáv)
 *
 * A hibakód a SZERVERRŐL jön rövid kódként, a lokalizálás itt történik
 * (projekt-konvenció). A siker-üzenet szándékosan nem árulja el, hogy a cím
 * már fent volt-e a listán.
 */

export type NewsletterFormVariant = "panel" | "inline" | "compact";

/** Zárt értékkészlet — a szerver `NEWSLETTER_SOURCES` enumjával egyezik. */
export type NewsletterFormSource =
  | "blog_post"
  | "blog_index"
  | "footer"
  | "try_complete"
  | "account";

interface NewsletterFormProps {
  source: NewsletterFormSource;
  variant?: NewsletterFormVariant;
  /**
   * Az űrlap MINDKÉT színsémán sötét panelen ül (ma: a lábléc). Ilyenkor a
   * világos tokenek eltűnnének, ezért a szöveg, a mező és a gomb is az
   * inverz készletet kapja — ugyanaz a szabály, mint a Button `onInverse`-én.
   */
  onInverse?: boolean;
  className?: string;
}

export function NewsletterForm({
  source,
  variant = "panel",
  onInverse = false,
  className,
}: NewsletterFormProps) {
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // mézesbödön
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleFirstTouch = () => {
    if (touched) return;
    setTouched(true);
    track("form.start", { form_id: "newsletter" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, source, website }),
      });

      if (res.ok) {
        setDone(true);
        track("form.submit", { form_id: "newsletter", outcome: "success" });
        return;
      }

      // A szerver rövid kódot ad, a szöveg itt lesz belőle.
      if (res.status === 429) setError(t("newsletter.errorRateLimited", locale));
      else if (res.status === 400) setError(t("newsletter.errorInvalid", locale));
      else setError(t("newsletter.errorGeneric", locale));
      track("form.submit", { form_id: "newsletter", outcome: "error" });
    } catch {
      setError(t("newsletter.errorGeneric", locale));
      track("form.submit", { form_id: "newsletter", outcome: "error" });
    } finally {
      setBusy(false);
    }
  };

  const strongText = onInverse ? "text-[var(--color-text-on-inverse)]" : "text-ink";
  const mutedText = onInverse ? "text-[var(--color-text-on-inverse-muted)]" : "text-muted";

  if (done) {
    return (
      <div role="status" aria-live="polite" className={wrapperClass(variant, onInverse, className)}>
        <div className="flex items-start gap-3">
          <SuccessCheck className="mt-0.5 shrink-0" />
          <div>
            <p className={`text-caption font-semibold ${strongText}`}>
              {t("newsletter.successTitle", locale)}
            </p>
            <p className={`mt-1 text-micro leading-relaxed ${mutedText}`}>
              {t("newsletter.successBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const form = (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={
        variant === "inline"
          ? "mt-3"
          : variant === "panel"
            ? "mt-5 max-w-[860px]"
            : "mt-4"
      }
    >
      <div
        className={
          variant === "panel"
            ? "grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px] md:items-end"
            : "flex flex-col gap-3"
        }
      >
        <TextField
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={handleFirstTouch}
          autoComplete="email"
          label={variant === "panel" ? t("newsletter.emailLabel", locale) : undefined}
          aria-label={variant === "panel" ? undefined : t("newsletter.emailLabel", locale)}
          placeholder={t("newsletter.emailPlaceholder", locale)}
          error={error ?? undefined}
          containerClassName={variant === "panel" ? "flex-1" : undefined}
          labelClassName={onInverse ? "!text-[var(--color-text-on-inverse)]" : undefined}
          inputClassName={[
            variant === "panel" ? "min-h-[48px]" : "",
            onInverse
              ? // A `!` szükséges: a TextField alap text/placeholder utilityjével
                // az arbitrary variánsok sorrendje nem determinisztikus — sötét
                // kártyán a tinta-szöveg olvashatatlan lenne (axe: 1.32).
                "!border-white/20 !bg-white/[0.06] !text-[var(--color-text-on-inverse)] placeholder:!text-[var(--color-text-on-inverse-muted)]"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {/* Mézesbödön — a botok kitöltik, az emberek nem látják. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <Button
          type="submit"
          loading={busy}
          disabled={busy}
          onInverse={onInverse}
          size={variant === "panel" ? "lg" : "md"}
          fullWidth={variant !== "panel"}
        >
          {busy ? t("newsletter.submitting", locale) : t("newsletter.submit", locale)}
        </Button>
      </div>

      <p className={`mt-3 text-micro leading-relaxed ${mutedText}`}>
        {t("newsletter.consent", locale)}{" "}
        <Link
          href="/privacy"
          className={`underline underline-offset-2 ${
            onInverse ? "hover:text-[var(--color-text-on-inverse)]" : "hover:text-ink"
          }`}
        >
          {t("newsletter.privacyLink", locale)}
        </Link>
      </p>
    </form>
  );

  return (
    <div className={wrapperClass(variant, onInverse, className)}>
      {variant === "panel" ? (
        <>
          <SectionEyebrow tone={onInverse ? "onDark" : "muted"}>
            {t("newsletter.eyebrow", locale)}
          </SectionEyebrow>
          <h2 className={`mt-2 font-fraunces text-heading leading-tight tracking-tight ${strongText}`}>
            {t("newsletter.title", locale)}
          </h2>
          <p
            className={`mt-2 max-w-[560px] text-caption leading-relaxed ${
              onInverse ? mutedText : "text-ink-body"
            }`}
          >
            {t("newsletter.sub", locale)}
          </p>
        </>
      ) : (
        <p className={`text-caption font-semibold ${strongText}`}>
          {t("newsletter.compactTitle", locale)}
        </p>
      )}
      {form}
      <span className="sr-only" aria-live="polite">
        {busy ? t("newsletter.submitting", locale) : ""}
      </span>
    </div>
  );
}

function wrapperClass(
  variant: NewsletterFormVariant,
  onInverse: boolean,
  className?: string,
): string {
  const base =
    variant === "panel"
      ? onInverse
        ? "rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8"
        : "rounded-2xl border border-sand bg-surface-card p-6 md:p-8"
      : variant === "compact"
        ? onInverse
          ? "rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4"
          : "rounded-xl border border-sand bg-surface-card px-5 py-4"
        : "";
  return className ? `${base} ${className}`.trim() : base;
}
