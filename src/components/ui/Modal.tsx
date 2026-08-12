"use client";

import { useEffect, useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayTransition } from "./useOverlayTransition";

/**
 * A be-/kilépő átmenet hossza. Amíg tart, a modal a DOM-ban marad — ezt
 * adta korábban az `AnimatePresence`; a framer-motion azért került ki, mert
 * modul-szintű importként a publikus oldalak JS-chunkjába is beszivárgott.
 */
const MODAL_TRANSITION_MS = 200;

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
  closeLabel?: string;
  mobilePosition?: "bottom" | "center";
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
  closeLabel = "Close",
  mobilePosition = "bottom",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalId = useId().replaceAll(":", "");
  const titleId = `modal-title-${modalId}`;
  const descriptionId = description ? `${titleId}-description` : undefined;
  const { shouldRender, isEntered } = useOverlayTransition(
    isOpen,
    MODAL_TRANSITION_MS,
  );
  const isBrand = design === "brand";

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusable = Array.from(
          modalRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ).filter((element) => !element.hasAttribute("hidden"));
        if (focusable.length === 0) {
          event.preventDefault();
          modalRef.current?.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
      const previouslyFocused = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      const frame = window.requestAnimationFrame(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        (firstFocusable ?? modalRef.current)?.focus();
      });
      return () => {
        window.cancelAnimationFrame(frame);
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        previouslyFocused?.focus();
      };
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted || !shouldRender) return null;

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-50 flex justify-center",
        isBrand && mobilePosition === "bottom"
          ? "items-end p-0 sm:items-center sm:p-4"
          : "items-center p-4",
      ].join(" ")}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          "absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none",
          isEntered ? "opacity-100" : "opacity-0",
          isBrand ? "bg-black/35" : "bg-black/40 backdrop-blur-sm",
        ].join(" ")}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hideHeader ? undefined : titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={[
          "transition-all duration-200 ease-out motion-reduce:transition-none",
          isEntered
            ? "translate-y-0 scale-100 opacity-100"
            : isBrand
              ? "translate-y-3 scale-[0.985] opacity-0"
              : "translate-y-2.5 scale-95 opacity-0",
          // max-h + görgethető törzs: nyitáskor a body scroll zárolva van,
          // ezért magas tartalomnál a panel különben kilógna a viewportból
          // (bottom-sheet módban a fejléc csúszna a képernyő fölé).
          "relative flex w-full max-h-[92dvh] flex-col overflow-hidden border md:max-h-[calc(100dvh-2rem)]",
          isBrand
            ? mobilePosition === "bottom"
              ? "max-w-none rounded-t-2xl bg-surface-card shadow-[0_18px_42px_rgba(26,26,46,0.18)] sm:max-w-[520px] sm:rounded-2xl"
              : "max-w-[520px] rounded-2xl bg-surface-card shadow-[0_18px_42px_rgba(26,26,46,0.18)]"
            : "max-w-md rounded-2xl bg-surface-card shadow-2xl",
          variant === "danger"
            ? (isBrand ? "border-[var(--color-state-error-border)]" : "border-state-error-border/70")
            : (isBrand ? "border-sand" : "border-sand/70"),
        ].join(" ")}
      >
        <div
          className={[
            "h-1 w-full shrink-0",
            variant === "danger"
              ? (isBrand
                ? "bg-[var(--color-action-destructive-bg)]"
                : "bg-gradient-to-r from-state-error-solid via-state-error-solid to-bronze-300")
              : (isBrand
                ? "bg-sage"
                : "bg-gradient-to-r from-sage-500 via-sage-500 to-state-info-solid"),
          ].join(" ")}
        />

        {!hideCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={[
              // 44px érintőcél az ikon optikai közepének megtartásával
              // (a korábbi p-1 + 20px ikon ≈ 28px volt).
              "absolute right-2 top-3 flex h-11 w-11 items-center justify-center rounded-lg transition",
              isBrand
                ? "text-ink-body/55 hover:bg-cream hover:text-ink-body"
                : "text-muted hover:bg-sand/50 hover:text-ink-body",
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
            ? "min-h-0 flex-1 overflow-y-auto p-4 pb-[max(18px,env(safe-area-inset-bottom))] sm:p-7"
            : mobilePosition === "center"
              ? "min-h-0 flex-1 overflow-y-auto p-4 pb-[max(18px,env(safe-area-inset-bottom))] sm:p-7"
              : "min-h-0 flex-1 overflow-y-auto p-4 pr-12 pb-[max(18px,env(safe-area-inset-bottom))] sm:p-7 sm:pr-14"}
        >
          {!hideHeader && (
            <div
              className={
                isBrand
                  ? mobilePosition === "center"
                    ? "grid grid-cols-[36px_minmax(0,1fr)_36px] items-start gap-3"
                    : "grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[36px_minmax(0,1fr)_36px]"
                  : "flex items-start gap-3"
              }
            >
              <div
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  !isBrand ? "mt-0.5" : "",
                  variant === "danger"
                    ? (isBrand ? "bg-[var(--color-state-error-bg)] text-[var(--color-state-error-fg)]" : "bg-state-error-bg text-state-error-fg")
                    : (isBrand ? "bg-sage-soft text-sage-dark" : "bg-sage-soft text-sage-dark"),
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
                  <p className="mb-2 font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                    {eyebrow}
                  </p>
                )}
                <h2
                  id={titleId}
                  className={[
                    "text-lg font-semibold",
                    isBrand ? "font-fraunces text-[28px] leading-[1.02] tracking-tight text-ink" : "",
                    variant === "danger"
                      ? (isBrand ? "text-ink" : "text-text-error-strong")
                      : (isBrand ? "text-ink" : "text-ink"),
                  ].join(" ")}
                >
                  {title}
                </h2>
                {description && (
                  isBrand && variant === "danger" ? (
                    <div className="mt-3 rounded-xl border border-sand bg-cream px-3 py-2.5">
                      <p className="text-sm leading-relaxed text-ink-body">{description}</p>
                    </div>
                  ) : (
                    <p
                      id={descriptionId}
                      className={[
                        "mt-2 text-sm leading-relaxed",
                        variant === "danger"
                          ? (isBrand ? "text-ink-body" : "text-state-error-fg")
                          : (isBrand ? "text-ink-body" : "text-ink-body"),
                      ].join(" ")}
                    >
                      {description}
                    </p>
                  )
                )}
              </div>
              {isBrand ? (
                <div
                  aria-hidden
                  className={mobilePosition === "center" ? "h-9 w-9" : "hidden h-9 w-9 sm:block"}
                />
              ) : null}
            </div>
          )}

          {children && <div className={hideHeader ? undefined : "mt-6"}>{children}</div>}
        </div>
      </div>
    </div>,
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
            {/* Lineáris telítődés a globals.css `trita-grow-x` keyframe-jével
                (scaleX 0→1) — a korábbi framer-motion width-tween helyett. */}
            <div
              style={{
                animation: `trita-grow-x ${loadingDurationMs}ms linear both`,
              }}
              className="h-full w-full origin-left rounded-full bg-sage"
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
          className="min-h-[44px] rounded-[10px] border border-sand bg-surface-card px-5 text-sm font-semibold text-ink-body transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`min-h-[44px] rounded-[10px] px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            variant === "danger"
              ? "bg-[var(--color-action-destructive-bg)] hover:bg-[var(--color-action-destructive-bg-hover)]"
              : "bg-sage hover:bg-sage-dark"
          }`}
        >
          {isLoading && loadingText ? loadingText : confirmText}
        </button>
      </div>
    </Modal>
  );
}
