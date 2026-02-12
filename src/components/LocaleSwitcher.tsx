"use client";

import { useState, useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { SUPPORTED_LOCALES, t, type Locale } from "@/lib/i18n";
import { Picker } from "@/components/ui/Picker";

interface LocaleSwitcherProps {
  className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const localeOptions = useMemo(
    () =>
      SUPPORTED_LOCALES.map((loc) => ({
        value: loc,
        label: t(`locale.${loc}` as const, locale),
      })),
    [locale],
  );

  const currentLabel = useMemo(
    () => localeOptions.find((opt) => opt.value === locale)?.label ?? locale.toUpperCase(),
    [locale, localeOptions],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative flex min-h-[44px] items-center rounded-lg border border-gray-100 bg-white pl-9 pr-7 text-xs font-semibold text-gray-700 transition hover:border-gray-200 ${className ?? ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute left-3 h-4 w-4 text-indigo-500"
        >
          <path
            fillRule="evenodd"
            d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm5.18 5.25h-2.03a12.98 12.98 0 0 0-.84-2.86 6.53 6.53 0 0 1 2.87 2.86ZM10 4.5c.6.78 1.07 1.73 1.4 2.75H8.6c.33-1.02.8-1.97 1.4-2.75ZM7.37 4.39a12.98 12.98 0 0 0-.84 2.86H4.5a6.53 6.53 0 0 1 2.87-2.86ZM4.18 8.75h2.1a13.95 13.95 0 0 0 0 2.5h-2.1a6.47 6.47 0 0 1 0-2.5Zm.32 4h2.03c.2 1.02.5 1.98.84 2.86a6.53 6.53 0 0 1-2.87-2.86Zm3.1 0h2.8c-.33 1.02-.8 1.97-1.4 2.75-.6-.78-1.07-1.73-1.4-2.75Zm3.2 0h2.67a11.46 11.46 0 0 1-.78 2.55 11.46 11.46 0 0 1-1.9-2.55Zm2.07-1.5H7.13a12.46 12.46 0 0 1 0-2.5h5.74c.09.41.13.83.13 1.25s-.04.84-.13 1.25Zm.6 4.36c.34-.88.64-1.84.84-2.86h2.03a6.53 6.53 0 0 1-2.87 2.86Zm1.15-4.36a13.95 13.95 0 0 0 0-2.5h2.1a6.47 6.47 0 0 1 0 2.5h-2.1Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-semibold text-gray-700">
          {currentLabel}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute right-2 h-4 w-4 text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.1 1.02l-4.25 4.5a.75.75 0 0 1-1.1 0l-4.25-4.5a.75.75 0 0 1 .02-1.04Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <Picker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(value) => {
          setLocale(value as Locale);
          setIsOpen(false);
        }}
        options={localeOptions}
        selectedValue={locale}
        title={t("locale.label", locale)}
      />
    </>
  );
}
