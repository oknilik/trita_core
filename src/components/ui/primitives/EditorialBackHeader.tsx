"use client";

import type { ReactNode } from "react";
import { BackControl } from "@/components/ui/primitives/BackControl";
import { cn } from "@/lib/ui/cn";

type EditorialBackAction =
  | { href: string; onBack?: never }
  | { href?: never; onBack: () => void };

type EditorialBackHeaderProps = EditorialBackAction & {
  backLabel: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
};

type EditorialBackControlProps = EditorialBackAction & {
  backLabel: string;
  className?: string;
  labelClassName?: string;
};

/** Az editorial visszavezérlő önálló változata olyan oldalakhoz,
 * ahol a cím egy saját hero- vagy tartalomkártyában marad. */
export function EditorialBackControl(props: EditorialBackControlProps) {
  const { backLabel, className, labelClassName } = props;

  if (props.onBack) {
    return (
      <BackControl
        onBack={props.onBack}
        label={backLabel}
        className={className}
        labelClassName={labelClassName}
      />
    );
  }

  if (!props.href) {
    throw new Error("EditorialBackControl requires href or onBack");
  }

  return (
    <BackControl
      href={props.href}
      label={backLabel}
      className={className}
      labelClassName={labelClassName}
    />
  );
}

/**
 * Oldalszintű visszanavigáció, a célkontextust és az aktuális címet egyetlen
 * editorial fejrészbe rendezve. Linkes és kliensállapotot váltó nézethez is jó.
 */
export function EditorialBackHeader({
  backLabel,
  eyebrow,
  title,
  description,
  headingLevel = 1,
  className,
  ...action
}: EditorialBackHeaderProps) {
  const headingClassName =
    "mt-1 max-w-2xl font-fraunces text-title text-[var(--color-text-primary)]";

  return (
    <header
      className={cn(
        "flex flex-col items-start gap-3",
        className,
      )}
    >
      <EditorialBackControl backLabel={backLabel} {...action} />
      <div className="min-w-0">
        <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
          {eyebrow}
        </p>
        {headingLevel === 1 ? (
          <h1 className={headingClassName}>{title}</h1>
        ) : (
          <h2 className={headingClassName}>{title}</h2>
        )}
        {description ? (
          <p className="mt-2 max-w-2xl text-body leading-relaxed text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
