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
        <label htmlFor={fieldId} className={cn("text-sm font-semibold text-text-primary", labelClassName)}>
          {label}
          {required ? <span className="ml-1 text-action-primary-bg">*</span> : null}
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
          "min-h-[44px] w-full rounded-lg border border-border-default bg-surface-card px-3 text-sm text-text-primary transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas",
          "disabled:cursor-not-allowed disabled:border-state-disabled-border disabled:bg-state-disabled-bg disabled:text-state-disabled-fg",
          hasError
            ? "border-state-error-border focus-visible:border-state-error-border focus-visible:ring-state-error-border"
            : "focus-visible:border-action-primary-bg focus-visible:ring-state-focus-ring",
          selectClassName,
        )}
        {...props}
      >
        {children}
      </select>
      {helpText ? (
        <p id={helpTextId} className={cn("text-xs text-text-secondary", helpTextClassName)}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={cn("text-xs text-state-error-fg", errorClassName)}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
