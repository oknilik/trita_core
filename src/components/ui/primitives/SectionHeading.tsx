import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type SectionHeadingSize = "sm" | "md" | "lg";

interface SectionHeadingProps {
  children: ReactNode;
  as?: ElementType;
  size?: SectionHeadingSize;
  className?: string;
}

const SIZE_CLASSES: Record<SectionHeadingSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export function SectionHeading({
  children,
  as: Component = "h2",
  size = "md",
  className,
}: SectionHeadingProps) {
  return (
    <Component className={cn("font-fraunces text-ink", SIZE_CLASSES[size], className)}>
      {children}
    </Component>
  );
}
