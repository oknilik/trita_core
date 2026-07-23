import { cn } from "@/lib/ui/cn";

// Egységes siker-pipa: sage kör fehér pipával (a share modal nyelve).
// Minden „sikerült" mikro-visszajelzés ezt használja, ne kézzel rakott
// emerald/zöld variánsokat.
export function SuccessCheck({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sage text-[10px] font-bold leading-none text-white",
        className,
      )}
    >
      ✓
    </span>
  );
}
