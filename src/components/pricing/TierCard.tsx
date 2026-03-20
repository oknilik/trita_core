import Link from "next/link";

export interface TierCardProps {
  eyebrow: string;
  name: string;
  badge?: string;
  price: string;
  priceSub: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "outline";
  highlighted?: boolean;
}

export function TierCard({
  eyebrow,
  name,
  badge,
  price,
  priceSub,
  description,
  features,
  ctaLabel,
  ctaHref,
  ctaVariant,
  highlighted = false,
}: TierCardProps) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 md:p-8 ${
        highlighted
          ? "border-[#c8410a] bg-[#fff5f0] shadow-sm"
          : "border-[#e8e4dc] bg-white"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-6 rounded-full bg-[#c8410a] px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
          {badge}
        </span>
      )}

      <p className="font-mono text-[10px] uppercase tracking-widest text-[#a09a90]">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-playfair text-2xl text-[#1a1814]">{name}</h3>
      <p className="mt-1.5 text-sm text-[#5a5650]">{description}</p>

      <div className="mt-5 border-t border-[#e8e4dc] pt-4">
        <span className="font-playfair text-4xl tracking-tight text-[#1a1814]">
          {price}
        </span>
        {priceSub && (
          <span className="ml-2 text-sm text-[#a09a90]">{priceSub}</span>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {features.map((f) => (
          <li
            key={f}
            className="relative pl-5 text-sm leading-relaxed text-[#3d3a35] before:absolute before:left-0 before:top-[0.75em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#c8410a]"
          >
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 text-sm font-semibold transition ${
          ctaVariant === "primary"
            ? "bg-[#c8410a] text-white hover:bg-[#b53a09]"
            : "border border-[#c8410a] text-[#c8410a] hover:bg-[#fff5f0]"
        }`}
      >
        {ctaLabel}
      </Link>
    </article>
  );
}
