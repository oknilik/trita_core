"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { StarLoader } from "@/components/ui/StarLoader";
import { TritaWordmark } from "@/components/TritaLogo";
import { buildEvaluationViewModel } from "@/lib/assessment-evaluation";

interface EvaluatingScreenProps {
  progress: number;
}

export function EvaluatingScreen({ progress }: EvaluatingScreenProps) {
  const { locale } = useLocale();
  const view = buildEvaluationViewModel(progress, locale);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-[var(--color-surface-inverse)] px-4 text-[var(--color-text-on-inverse)]"
    >
      <div aria-hidden className="absolute -right-48 -top-72 h-[34rem] w-[34rem] rounded-full bg-[var(--color-accent-primary)]/15 blur-3xl" />
      <div aria-hidden className="absolute -bottom-72 -left-48 h-[30rem] w-[30rem] rounded-full bg-[var(--color-accent-candidate)]/10 blur-3xl" />
      <TritaWordmark className="absolute left-6 top-6 text-3xl text-[var(--color-text-on-inverse)] md:left-10 md:top-8" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex w-full max-w-xl flex-col items-center text-center"
      >
        <div className="relative flex h-52 w-52 items-center justify-center md:h-60 md:w-60">
          <div aria-hidden className="absolute inset-5 animate-[pulse_3.6s_ease-in-out_infinite] rounded-full border border-white/15 shadow-[0_0_0_24px_rgba(255,255,255,0.025),0_0_0_50px_rgba(255,255,255,0.015)] motion-reduce:animate-none" />
          <StarLoader size={112} color="var(--color-text-on-inverse)" />
        </div>
        <p className="text-label uppercase text-[var(--color-accent-primary-soft)]">
          {view.kicker}
        </p>
        <h2 className="mt-4 max-w-[14ch] font-fraunces text-3xl font-medium leading-tight tracking-tight md:text-4xl">
          {t("assessment.evaluatingTitle", locale)}
        </h2>
        <p className="mt-3 text-sm text-[var(--color-text-on-inverse-muted)]">
          {view.body}
        </p>
        <motion.p
          key={view.phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 min-h-10 font-fraunces text-base text-[var(--color-accent-primary-soft)]"
        >
          {view.phaseMessage}
        </motion.p>
        <div className="mt-3 h-1 w-64 overflow-hidden rounded-full bg-white/15 md:w-80">
          <motion.div
            className="h-full rounded-full bg-[var(--color-accent-primary-soft)]"
            initial={{ width: 0 }}
            animate={{ width: `${view.safeProgress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <p className="mt-3 text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
          {view.status} · {view.roundedProgress}%
        </p>
      </motion.div>
    </div>
  );
}
