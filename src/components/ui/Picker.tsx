"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

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
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  // Scroll to selected item when opening
  useEffect(() => {
    if (isOpen && selectedRef.current) {
      // Small delay to ensure the element is rendered
      const timer = setTimeout(() => {
        selectedRef.current?.scrollIntoView({ block: "center" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      const timer = setTimeout(() => {
        searchRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  const handleSelect = (value: string) => {
    onSelect(value);
    handleClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-50 w-full max-w-lg overflow-hidden rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] md:mb-0 md:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <button
                type="button"
                onClick={handleClose}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
              <div className="border-b border-gray-100 px-4 py-2">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="min-h-[44px] w-full rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none"
                />
              </div>
            )}

            {/* Options list */}
            <div
              ref={listRef}
              className="max-h-[50vh] overflow-y-auto overscroll-contain px-2 py-2"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-400">
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
                      className={`flex min-h-[44px] w-full items-center rounded-lg px-3 text-sm font-medium transition ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="ml-auto h-5 w-5 text-indigo-500"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
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
    <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
      {label}
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[44px] items-center justify-between rounded-lg border-2 border-gray-200 bg-gray-50 px-3 text-left text-sm transition hover:border-gray-300 focus:border-indigo-300 focus:outline-none"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 text-gray-400"
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
