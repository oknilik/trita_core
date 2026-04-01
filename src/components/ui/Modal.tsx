"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  variant?: "default" | "danger";
  design?: "default" | "brand";
  hideCloseButton?: boolean;
  hideHeader?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  eyebrow,
  children,
  variant = "default",
  design = "brand",
  hideCloseButton = false,
  hideHeader = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const isBrand = design === "brand";

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={[
            "fixed inset-0 z-50 flex justify-center",
            isBrand ? "items-end p-0 sm:items-center sm:p-4" : "items-center p-4",
          ].join(" ")}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={[
              "absolute inset-0",
              isBrand ? "bg-black/35" : "bg-black/40 backdrop-blur-sm",
            ].join(" ")}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: isBrand ? 0.985 : 0.95, y: isBrand ? 12 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isBrand ? 0.985 : 0.95, y: isBrand ? 12 : 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={[
              "relative w-full overflow-hidden border",
              isBrand
                ? "max-w-none rounded-t-2xl bg-white shadow-[0_18px_42px_rgba(26,26,46,0.18)] sm:max-w-[520px] sm:rounded-2xl"
                : "max-w-md rounded-2xl bg-white shadow-2xl",
              variant === "danger"
                ? (isBrand ? "border-[#eadccf]" : "border-rose-200/70")
                : (isBrand ? "border-sand" : "border-gray-100"),
            ].join(" ")}
          >
            <div
              className={[
                "h-1 w-full",
                variant === "danger"
                  ? (isBrand
                    ? "bg-[var(--color-accent-primary)]"
                    : "bg-gradient-to-r from-rose-400 via-rose-500 to-orange-400")
                  : (isBrand
                    ? "bg-sage"
                    : "bg-gradient-to-r from-indigo-400 via-indigo-500 to-sky-400"),
              ].join(" ")}
            />

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={[
                  "absolute right-4 top-5 rounded-lg p-1 transition",
                  isBrand
                    ? "text-ink-body/55 hover:bg-cream hover:text-ink-body"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                ].join(" ")}
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
            )}

            <div
              className={hideCloseButton
                ? "p-4 pb-[max(18px,env(safe-area-inset-bottom))] sm:p-7"
                : "p-4 pr-11 pb-[max(18px,env(safe-area-inset-bottom))] sm:p-7 sm:pr-14"}
            >
              {!hideHeader && (
                <div
                  className={
                    isBrand
                      ? "grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[36px_minmax(0,1fr)_36px]"
                      : "flex items-start gap-3"
                  }
                >
                  <div
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      !isBrand ? "mt-0.5" : "",
                      variant === "danger"
                        ? (isBrand ? "bg-[#f8eee8] text-[#8c4a31]" : "bg-rose-100 text-rose-700")
                        : (isBrand ? "bg-sage-soft text-sage-dark" : "bg-indigo-100 text-indigo-700"),
                    ].join(" ")}
                  >
                    {variant === "danger" ? (
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3h4m-7 3h10m-1 0-.7 9.1a1.2 1.2 0 0 1-1.2 1.1H8a1.2 1.2 0 0 1-1.2-1.1L6 6m2 0v8m4-8v8" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 6.5v4.5m0 3h.01M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" />
                      </svg>
                    )}
                  </div>
                  <div className={isBrand ? "text-center" : undefined}>
                    {eyebrow && (
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-bronze/80">
                        {eyebrow}
                      </p>
                    )}
                    <h2
                      className={[
                        "text-lg font-semibold",
                        isBrand ? "font-fraunces text-[28px] leading-[1.02] tracking-tight text-ink" : "",
                        variant === "danger"
                          ? (isBrand ? "text-ink" : "text-rose-900")
                          : (isBrand ? "text-ink" : "text-gray-900"),
                      ].join(" ")}
                    >
                      {title}
                    </h2>
                    {description && (
                      isBrand && variant === "danger" ? (
                        <div className="mt-3 rounded-xl border border-[#eadccf] bg-[#fcf5ef] px-3 py-2.5">
                          <p className="text-sm leading-relaxed text-ink-body">{description}</p>
                        </div>
                      ) : (
                        <p
                          className={[
                            "mt-2 text-sm leading-relaxed",
                            variant === "danger"
                              ? (isBrand ? "text-ink-body" : "text-rose-700")
                              : (isBrand ? "text-ink-body" : "text-gray-600"),
                          ].join(" ")}
                        >
                          {description}
                        </p>
                      )
                    )}
                  </div>
                  {isBrand ? <div aria-hidden className="hidden h-9 w-9 sm:block" /> : null}
                </div>
              )}

              {children && <div className={hideHeader ? undefined : "mt-6"}>{children}</div>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  loadingText?: string;
  loadingNote?: string;
  loadingDurationMs?: number;
  variant?: "default" | "danger";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  loadingText,
  loadingNote,
  loadingDurationMs = 1300,
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  if (isLoading && loadingNote) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        variant="default"
        design="brand"
        hideCloseButton
        hideHeader
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand border-t-sage" />
          <p className="mt-4 text-base font-semibold text-ink">{loadingNote}</p>
          <div className="mt-5 h-2 w-64 overflow-hidden rounded-full bg-cream md:w-80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: loadingDurationMs / 1000, ease: "linear" }}
              className="h-full rounded-full bg-sage"
            />
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      design="brand"
    >
      <div className="flex flex-col-reverse items-center gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="min-h-[44px] rounded-[10px] border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`min-h-[44px] rounded-[10px] px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            variant === "danger"
              ? "bg-[#8c4a31] hover:bg-[#7a3f2a]"
              : "bg-sage hover:bg-sage-dark"
          }`}
        >
          {isLoading && loadingText ? loadingText : confirmText}
        </button>
      </div>
    </Modal>
  );
}
