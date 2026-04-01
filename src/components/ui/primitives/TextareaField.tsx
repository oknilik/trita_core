import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helpTextClassName?: string;
  errorClassName?: string;
  textareaClassName?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  {
    id,
    name,
    label,
    required,
    helpText,
    error,
    containerClassName,
    labelClassName,
    helpTextClassName,
    errorClassName,
    textareaClassName,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId().replaceAll(":", "");
  const fieldId = id ?? name ?? `textarea-field-${generatedId}`;
  const helpTextId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpTextId, errorId].filter(Boolean).join(" ") || undefined;
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label ? (
        <label htmlFor={fieldId} className={cn("text-sm font-semibold text-ink", labelClassName)}>
          {label}
          {required ? <span className="ml-1 text-bronze">*</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={fieldId}
        name={name}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={hasError || ariaInvalid || undefined}
        className={cn(
          "min-h-[120px] w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
          "disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted",
          hasError
            ? "border-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-200"
            : "border-sand focus-visible:border-sage/45 focus-visible:ring-sage/20",
          textareaClassName,
        )}
        {...props}
      />
      {helpText ? (
        <p id={helpTextId} className={cn("text-xs text-ink-body/70", helpTextClassName)}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={cn("text-xs text-rose-600", errorClassName)}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
