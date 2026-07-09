import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helpTextClassName?: string;
  errorClassName?: string;
  inputClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
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
    inputClassName,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId().replaceAll(":", "");
  const fieldId = id ?? name ?? `text-field-${generatedId}`;
  const helpTextId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpTextId, errorId].filter(Boolean).join(" ") || undefined;
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-[var(--ui-space-field-gap)]", containerClassName)}>
      {label ? (
        <label htmlFor={fieldId} className={cn("text-sm font-semibold text-text-primary", labelClassName)}>
          {label}
          {required ? <span className="ml-1 text-action-primary-bg">*</span> : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={fieldId}
        name={name}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={hasError || ariaInvalid || undefined}
        className={cn(
          "min-h-[44px] w-full rounded-[var(--ui-radius-lg)] border border-border-default bg-surface-card px-[var(--ui-space-3)] text-sm text-text-primary placeholder:text-text-muted transition",
          "duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas",
          "disabled:cursor-not-allowed disabled:border-state-disabled-border disabled:bg-state-disabled-bg disabled:text-state-disabled-fg",
          hasError
            ? "border-state-error-border focus-visible:border-state-error-border focus-visible:ring-state-error-border"
            : "focus-visible:border-action-primary-bg focus-visible:ring-state-focus-ring",
          inputClassName,
        )}
        {...props}
      />
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
