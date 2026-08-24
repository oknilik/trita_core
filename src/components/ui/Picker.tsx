"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { useOverlayTransition } from "./useOverlayTransition";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

/**
 * A panel be-/kicsúszásának hossza (a backdrop 200 ms-os fade-je ezen belül
 * végigfut). Amíg tart, a picker a DOM-ban marad — ezt adta korábban az
 * `AnimatePresence`. A framer-motion azért került ki, mert modul-szintű
 * importként a publikus oldalak közös JS-chunkját is hizlalta.
 */
const PICKER_TRANSITION_MS = 300;

interface PickerOption {
  value: string;
  label: string;
}

interface PickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: PickerOption[];
  selectedValue?: string;
  title: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Picker({
  isOpen,
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
  searchable = false,
  searchPlaceholder = "",
}: PickerProps) {
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const { shouldRender, isEntered } = useOverlayTransition(
    isOpen,
    PICKER_TRANSITION_MS,
  );
  const titleId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // P1-UX-03: dialog-szerződés — bezáráskor a fókusz a nyitó elemre tér vissza.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const filtered = searchable && search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const handleClose = useCallback(() => {
    setSearch("");
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      // Fókusz-csapda (a Modal mintája): Tab nem hagyhatja el a panelt.
      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button, input, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) {
          e.preventDefault();
          panelRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleClose],
  );

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Kezdő fókusz a panelbe (kereshetőnél a keresőmező kapja külön).
      const timer = setTimeout(() => {
        if (document.activeElement === document.body || document.activeElement === null) {
          panelRef.current?.focus();
        } else if (!panelRef.current?.contains(document.activeElement)) {
          panelRef.current?.focus();
        }
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        previouslyFocusedRef.current?.focus();
      };
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Scroll to selected item when opening.
  // A ref-ellenőrzés a késleltetésen BELÜL van: a panel a nyitást követő
  // festéskor kerül a DOM-ba, tehát a hatás lefutásakor a ref még üres
  // lehetne — korábban ez a feltétel a render-fázisból adódóan mindig
  // teljesült.
  useEffect(() => {
    if (!isOpen) return;
    // Small delay to ensure the element is rendered
    const timer = setTimeout(() => {
      selectedRef.current?.scrollIntoView({ block: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (!isOpen || !searchable) return;
    const timer = setTimeout(() => {
      searchRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen, searchable]);

  const handleSelect = (value: string) => {
    onSelect(value);
    handleClose();
  };

  if (!mounted || !shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity duration-200 motion-reduce:transition-none ${
          isEntered ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel — címkézett dialog, témázott felülettel (fix világos háttér
          helyett token: sötét témában is a saját felület-színét kapja). */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-50 w-full max-w-lg overflow-hidden rounded-t-2xl bg-[var(--color-surface-header)] pb-[env(safe-area-inset-bottom)] outline-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none md:mb-0 md:rounded-2xl ${
          isEntered ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
          <h3 id={titleId} className="font-dm-sans text-sm font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t("common.close", locale)}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-body/40 transition hover:bg-[var(--color-surface-subtle)] hover:text-ink ${FOCUS_RING_CLASS}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Search */}
        {searchable && (
          <div className="border-b border-[var(--color-border-default)] px-4 py-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder || title}
              className={`min-h-[44px] w-full rounded-lg border border-[var(--color-border-default)] bg-surface-card px-3 text-sm text-ink focus-visible:border-[var(--color-accent-primary)] ${FOCUS_RING_CLASS}`}
            />
          </div>
        )}

        {/* Options list */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto overscroll-contain px-2 py-2"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-ink-body/40">
              —
            </div>
          ) : (
            filtered.map((option) => {
              const isSelected = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  ref={isSelected ? selectedRef : undefined}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex min-h-[44px] w-full items-center rounded-xl px-3 text-sm font-medium transition ${FOCUS_RING_CLASS} ${
                    isSelected
                      ? "bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]"
                      : "text-ink-body hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  {option.label}
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="ml-auto h-5 w-5 text-[var(--color-accent-primary)]"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* Trigger button — consistent with the onboarding design */
interface PickerTriggerProps {
  label: string;
  value?: string;
  placeholder: string;
  onClick: () => void;
}

export function PickerTrigger({
  label,
  value,
  placeholder,
  onClick,
}: PickerTriggerProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-ink-body">
      {label}
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        className={`flex min-h-[44px] items-center justify-between rounded-lg border-2 border-sand bg-surface-subtle px-3 text-left text-sm transition hover:border-sand focus-visible:border-sage-ring ${FOCUS_RING_CLASS}`}
      >
        <span className={value ? "text-ink" : "text-muted"}>
          {value || placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 text-muted"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </label>
  );
}
