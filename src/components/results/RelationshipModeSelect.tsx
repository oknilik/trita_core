"use client";

import { cn } from "@/lib/ui/cn";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type RelationshipMode = "peer" | "other-leads" | "self-leads";

interface RelationshipModeOption {
  value: RelationshipMode;
  label: string;
}

interface RelationshipModeSelectProps {
  label: string;
  value: RelationshipMode;
  options: RelationshipModeOption[];
  onChange: (value: RelationshipMode) => void;
  /**
   * Elhelyezés a befoglaló felületen. A kontroll nem tudhatja, hogy egy
   * sötét hero alá lóg-e be (valódi páros) vagy sima folyamban áll-e
   * (karakter-szimuláció) — ezért a margó/átlapolás kívülről jön.
   */
  className?: string;
}

function RelationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.25" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 14.5a4.5 4.5 0 0 1 6.5 4" />
    </svg>
  );
}

export function RelationshipModeSelect({
  label,
  value,
  options,
  onChange,
  className,
}: RelationshipModeSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const labelId = useId();
  const valueId = useId();
  const listboxId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[selectedIndex]?.focus();
  }, [open, selectedIndex]);

  const closeAndFocusTrigger = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const choose = (nextValue: RelationshipMode) => {
    onChange(nextValue);
    closeAndFocusTrigger();
  };

  const moveFocus = (index: number) => {
    const normalized = (index + options.length) % options.length;
    optionRefs.current[normalized]?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(options.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
    } else if (event.key === "Tab") {
      // A lista bezárása unmountolja a fókuszált opciót — ha a böngésző
      // default tabbolása is lefut, a fókusz a <body>-ra esik. Ezért itt mi
      // adjuk vissza a triggerre, onnan tabbol tovább a user.
      event.preventDefault();
      closeAndFocusTrigger();
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative z-20 flex items-center gap-3 rounded-2xl border border-[var(--color-border-default)] bg-surface-card p-3 shadow-[var(--ui-shadow-md)]",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]">
        <RelationIcon />
      </span>

      <div className="relative min-w-0 flex-1">
        <span
          id={labelId}
          className="block text-micro text-[var(--color-text-muted)]"
        >
          {label}
        </span>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={`${labelId} ${valueId}`}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
          className="flex min-h-[44px] w-full items-center gap-3 text-left text-caption font-semibold text-[var(--color-text-primary)]"
        >
          <span id={valueId} className="min-w-0 flex-1 truncate">
            {selected.label}
          </span>
          <span
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 6 5 5 5-5" />
            </svg>
          </span>
        </button>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-surface-card p-1.5 shadow-[var(--ui-shadow-lg)]"
          >
            {options.map((option, index) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  // A listbox EGY tab-stop: a nyitott lista opciói között
                  // nyíllal lépünk (roving fókusz), nem Tabbal.
                  tabIndex={-1}
                  onClick={() => choose(option.value)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-caption transition-colors ${
                    active
                      ? "bg-[var(--color-surface-highlight-warm)] font-semibold text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? "border-[var(--color-accent-primary-strong)]"
                        : "border-[var(--color-border-default)]"
                    }`}
                  >
                    {active ? (
                      <span className="h-2 w-2 rounded-full bg-[var(--color-accent-primary-strong)]" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">{option.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
