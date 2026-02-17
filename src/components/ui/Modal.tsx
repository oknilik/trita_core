"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: "default" | "danger";
  hideCloseButton?: boolean;
  hideHeader?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "default",
  hideCloseButton = false,
  hideHeader = false,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl ${
              variant === "danger" ? "border-rose-200/70" : "border-gray-100"
            }`}
          >
            <div
              className={`h-1 w-full ${
                variant === "danger"
                  ? "bg-gradient-to-r from-rose-400 via-rose-500 to-orange-400"
                  : "bg-gradient-to-r from-indigo-400 via-indigo-500 to-sky-400"
              }`}
            />

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-5 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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

            <div className={hideCloseButton ? "p-6" : "p-6 pr-12"}>
              {!hideHeader && (
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      variant === "danger"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
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
                  <div>
                    <h2
                      className={`text-lg font-semibold ${
                        variant === "danger" ? "text-rose-900" : "text-gray-900"
                      }`}
                    >
                      {title}
                    </h2>
                    {description && (
                      <p
                        className={`mt-2 text-sm leading-relaxed ${
                          variant === "danger" ? "text-rose-700" : "text-gray-600"
                        }`}
                      >
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {children && <div className={hideHeader ? undefined : "mt-6"}>{children}</div>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
        hideCloseButton
        hideHeader
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-5xl leading-none">🤗</div>
          <p className="mt-4 text-base font-semibold text-indigo-700">{loadingNote}</p>
          <div className="mt-5 h-2 w-64 overflow-hidden rounded-full bg-gray-100 md:w-80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: loadingDurationMs / 1000, ease: "linear" }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="min-h-[44px] rounded-lg border border-gray-100 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`min-h-[48px] rounded-lg px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
            variant === "danger"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-gradient-to-r from-indigo-600 to-purple-600"
          }`}
        >
          {isLoading && loadingText ? loadingText : confirmText}
        </button>
      </div>
    </Modal>
  );
}
