"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { isFocusRoute } from "@/lib/navigation/focus-routes";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Kilépő animáció fut — a DOM-ban marad, amíg le nem jár. */
  exiting: boolean;
}

/** Automatikus eltűnés ennyi láthatóság után (változatlan). */
const TOAST_VISIBLE_MS = 4000;
/** A kilépő átmenet hossza — addig NEM töröljük a DOM-ból a toastot. */
const TOAST_EXIT_MS = 200;

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const pathname = usePathname();
  const focusRoute = isFocusRoute(pathname);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Élő időzítők — unmountkor takarítunk, hogy ne írjunk halott fába.
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  // Amelyik toast már kilépőben van, azt ne indítsuk el másodszor
  // (auto-eltűnés + kézi bezárás egyszerre).
  const exitingRef = useRef<Set<string>>(new Set());
  // Toastonkénti auto-eltűnés időzítő. Kézi bezáráskor le KELL állítani:
  // különben a már eltávolított toast 4 mp-nél újra végigfutna a kilépő
  // ágon (fölösleges állapotfrissítés + 200 ms-ig fantom bejegyzés az
  // `exitingRef`-ben).
  const autoTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const timers = timersRef.current;
    const autoTimers = autoTimersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
      autoTimers.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    if (exitingRef.current.has(id)) return;
    exitingRef.current.add(id);

    // A még függő auto-eltűnés ehhez a toasthoz már okafogyott.
    const autoTimer = autoTimersRef.current.get(id);
    if (autoTimer !== undefined) {
      clearTimeout(autoTimer);
      autoTimersRef.current.delete(id);
      timersRef.current.delete(autoTimer);
    }
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast)),
    );

    // A tényleges törlés CSAK a kilépő átmenet után — enélkül a toast
    // félbevágva tűnne el (ezt adta korábban az AnimatePresence).
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      exitingRef.current.delete(id);
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_EXIT_MS);
    timersRef.current.add(timer);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        autoTimersRef.current.delete(id);
        dismissToast(id);
      }, TOAST_VISIBLE_MS);
      timersRef.current.add(timer);
      autoTimersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Mobilon a jobb szélhez kötött, fix szélességű toast a bal viewport-
          szélen túllógna — <md-en két oldalt 16px margóval feszül ki,
          md-től marad a jobb alsó sarok. */}
      <div
        className={`fixed inset-x-4 z-50 flex flex-col gap-2 pb-[env(safe-area-inset-bottom)] md:left-auto md:right-4 ${
          focusRoute
            ? "bottom-[calc(7.5rem+env(safe-area-inset-bottom))] md:bottom-4"
            : "bottom-4"
        }`}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  // Státusz-egykapu (2026-08): a state-* tokenek beszélnek — a korábbi
  // green/rose/indigo Tailwind-készlet (harmadik zöld-család, token-idegen
  // info-indigó) kivezetve.
  const styles = {
    success: {
      container:
        "border-[var(--color-state-success-border)] bg-[var(--color-state-success-bg)]",
      icon: "text-[var(--color-state-success-fg)]",
      text: "text-[var(--color-state-success-fg)]",
    },
    error: {
      container:
        "border-[var(--color-state-error-border)] bg-[var(--color-state-error-bg)]",
      icon: "text-[var(--color-state-error-fg)]",
      text: "text-[var(--color-state-error-fg)]",
    },
    info: {
      container:
        "border-[var(--color-state-info-border)] bg-[var(--color-state-info-bg)]",
      icon: "text-[var(--color-state-info-fg)]",
      text: "text-[var(--color-state-info-fg)]",
    },
  };

  const style = styles[toast.type];

  // Be-/kilépés CSS-átmenettel (framer-motion helyett). A kiinduló állapotot
  // az első festés után váltjuk „belépettre" — enélkül nem indulna átmenet.
  const [isEntered, setIsEntered] = useState(false);
  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setIsEntered(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  const motionClass = toast.exiting
    ? "translate-x-[100px] scale-95 opacity-0"
    : isEntered
      ? "translate-x-0 translate-y-0 scale-100 opacity-100"
      : "translate-y-5 scale-95 opacity-0";

  return (
    <div
      className={`flex min-w-0 max-w-full items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-200 ease-out motion-reduce:transition-none md:min-w-[280px] md:max-w-sm ${motionClass} ${style.container}`}
    >
      {/* Icon */}
      <div className={`shrink-0 ${style.icon}`}>
        {toast.type === "success" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {toast.type === "error" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {toast.type === "info" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Message */}
      <p className={`min-w-0 flex-1 break-words text-sm font-medium ${style.text}`}>
        {toast.message}
      </p>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={`shrink-0 rounded p-0.5 transition hover:bg-black/5 ${style.icon}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}
