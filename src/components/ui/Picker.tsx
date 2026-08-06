"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useOverlayTransition } from "./useOverlayTransition";

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
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const { shouldRender, isEntered } = useOverlayTransition(
    isOpen,
    PICKER_TRANSITION_MS,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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
      if (e.key === "Escape") handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
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

      {/* Panel */}
      <div
        className={`relative z-50 w-full max-w-lg overflow-hidden rounded-t-2xl bg-[#faf9f6] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none md:mb-0 md:rounded-2xl ${
          isEntered ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
          <h3 className="font-dm-sans text-sm font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-body/40 transition hover:bg-[var(--color-surface-subtle)] hover:text-ink"
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
              className="min-h-[44px] w-full rounded-lg border border-[var(--color-border-default)] bg-white px-3 text-sm text-ink focus:border-[var(--color-accent-primary)] focus:outline-none"
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
                  className={`flex min-h-[44px] w-full items-center rounded-xl px-3 text-sm font-medium transition ${
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
        className="flex min-h-[44px] items-center justify-between rounded-lg border-2 border-sand bg-surface-subtle px-3 text-left text-sm transition hover:border-sand focus:border-indigo-300 focus:outline-none"
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
