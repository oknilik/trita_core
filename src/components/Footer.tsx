"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="relative w-full bg-white pt-4">
      <svg className="absolute inset-x-0 -top-5 h-7 w-full text-white" viewBox="0 0 1200 50" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,50 L0,30 C150,2 350,44 600,22 C850,0 1050,44 1200,30 L1200,50 Z" />
      </svg>
      <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-4">
        <p className="text-xs text-gray-400">
          © Trita 2026. {t("landing.footer", locale)}
        </p>
      </div>
    </footer>
  );
}
