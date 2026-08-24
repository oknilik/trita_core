"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { TritaWordmark } from "@/components/TritaLogo";
import AuthLeftPanel, { type AuthLeftPanelContext } from "@/components/auth/AuthLeftPanel";
import { BackControl } from "@/components/ui/primitives/BackControl";
import { t } from "@/lib/i18n";

interface AuthPageShellProps {
  panelContext: AuthLeftPanelContext;
  children: ReactNode;
}

export default function AuthPageShell({ panelContext, children }: AuthPageShellProps) {
  const { locale } = useLocale();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface-canvas)] pb-6">
      <header className="mx-auto mt-2 flex h-14 w-[calc(100%-1.5rem)] max-w-[1180px] items-center justify-between rounded-[19px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 px-3 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] sm:px-4 lg:mt-3 lg:h-[68px] lg:rounded-[22px] lg:px-5">
        <Link
          href="/"
          aria-label="trita"
          className="inline-flex min-h-11 items-center rounded-md text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2"
        >
          <TritaWordmark className="text-heading tracking-[-0.04em]" />
        </Link>
        <BackControl href="/" label={t("auth.backHome", locale)} />
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid w-full max-w-[440px] lg:max-w-[960px] lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-[var(--color-border-soft)] lg:bg-[var(--color-surface-card)] lg:shadow-[var(--ui-shadow-lg)]">
          {/* A fő tartalom van előbb a DOM-ban, így a h1 mindig megelőzi a
              dekoratív oldalsáv h2-jét; desktopon csak vizuálisan kerül jobbra. */}
          <section className="flex min-w-0 flex-col justify-center px-2 py-5 sm:px-6 lg:col-start-2 lg:row-start-1 lg:px-12 lg:py-12">
            {children}
          </section>
          <AuthLeftPanel
            context={panelContext}
            className="lg:col-start-1 lg:row-start-1"
          />
        </div>
      </main>

      <p className="mx-auto w-[calc(100%-2rem)] max-w-[440px] border-t border-[var(--color-border-default)] pt-5 text-center text-xs text-[var(--color-text-muted)] sm:w-[calc(100%-3rem)] lg:max-w-[960px]">
        {t("auth.helpPrompt", locale)}{" "}
        <Link
          href="/contact"
          className="font-semibold text-[var(--color-accent-self-deep)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)]"
        >
          {t("auth.helpLink", locale)}
        </Link>
      </p>
    </div>
  );
}
