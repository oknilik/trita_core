import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

// Működés gyűjtőfül — üzemeltetési nézetek belépői
const OPS_CARDS = [
  {
    href: "/admin?tab=feedback",
    title: "Visszajelzések",
    desc: "Szerep-kalibráció, érdeklődés-jelzések és elégedettség-aggregátumok.",
  },
  {
    href: "/admin?tab=reminders",
    title: "Emlékeztetők",
    desc: "Kitöltési emlékeztetők és piszkozat-követés.",
  },
];

export function OpsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {OPS_CARDS.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group rounded-2xl border border-sand bg-surface-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sage/40"
        >
          <p className="inline-flex items-center gap-1 text-body font-semibold text-ink group-hover:text-[var(--color-accent-primary-strong)]">
            {card.title}
            <ChevronRightIcon />
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-body">{card.desc}</p>
        </Link>
      ))}
    </div>
  );
}
