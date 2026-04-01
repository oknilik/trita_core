import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helpTextClassName?: string;
  errorClassName?: string;
  selectClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
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
    selectClassName,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId().replaceAll(":", "");
  const fieldId = id ?? name ?? `select-field-${generatedId}`;
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
      <select
        ref={ref}
        id={fieldId}
        name={name}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={hasError || ariaInvalid || undefined}
        className={cn(
          "min-h-[44px] w-full rounded-lg border bg-white px-3 text-sm text-ink transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
          "disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted",
          hasError
            ? "border-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-200"
            : "border-sand focus-visible:border-sage/45 focus-visible:ring-sage/20",
          selectClassName,
        )}
        {...props}
      >
        {children}
      </select>
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
