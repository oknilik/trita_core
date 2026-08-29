import Link from "next/link";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

// ─────────────────────────────────────────────────────────────────────
// Admin navigáció — modern dashboard-elrendezés (2026-07-28):
//   · lg felett: bal oldalsáv, csoportosított menüpontokkal (Áttekintés /
//     Ügyfelek / Tartalom / Működés) — a tartalom mellette él.
//   · lg alatt: vízszintesen GÖRGETHETŐ pill-sor (nincs flex-1, nincs
//     törés) — a korábbi sáv kilógott/eltört, mert 6 fül egyenlő
//     szélességre volt kényszerítve.
// A feedback/reminders nézetek látható menüpontok a Működés csoportban
// (korábban rejtett al-fülek voltak, csak mélylinkről nyíltak).
// ─────────────────────────────────────────────────────────────────────

export type AdminTabId =
  | "overview"
  | "analytics"
  | "crm"
  | "inquiries"
  | "orgs"
  | "consultants"
  | "blog"
  | "ops"
  | "legal"
  | "feedback"
  | "reminders";

interface NavItem {
  id: AdminTabId;
  label: string;
  badge?: number;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const ICON = "h-4 w-4 shrink-0";

function buildGroups(newInquiryCount: number, crmDueCount: number): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: null,
      items: [
        {
          id: "overview",
          label: "Vezérlő",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="1" y="1" width="6" height="6" rx="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" />
            </svg>
          ),
        },
        {
          // Analitika — a saját, first-party eseményrendszer kiértékelése
          // (forgalom, akvizíciós tölcsér, kitöltési lemorzsolódás).
          // A Vezérlő MELLÉ került, nem a Működés alá: ez terméki döntés-
          // támogatás, nem üzemeltetés.
          id: "analytics",
          label: "Analitika",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 14.5h13" />
              <path d="M3.5 11.5v-3M7 11.5v-6M10.5 11.5v-4M14 11.5v-8" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Ügyfelek",
      items: [
        ...(isPortfolioSurfaceActive("crm")
          ? [
              {
                // CRM — a napi értékesítési hurok (Ma/Beérkező/Pipeline/Lezártak);
                // a badge az esedékes (lejárt + mai) next actionök száma.
                id: "crm" as const,
                label: "CRM",
                badge: crmDueCount > 0 ? crmDueCount : undefined,
                icon: (
                  <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.5 2h13L10 7.5V13l-4 1.5V7.5L1.5 2Z" />
                  </svg>
                ),
              },
            ]
          : []),
        {
          id: "inquiries",
          label: "Kérdések",
          badge: newInquiryCount > 0 ? newInquiryCount : undefined,
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 10a1.5 1.5 0 0 1-1.5 1.5H8l-3 3v-3H3.5A1.5 1.5 0 0 1 2 10V4a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 14 4v6Z" />
            </svg>
          ),
        },
        {
          id: "orgs",
          label: "Szervezetek",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="14" height="14" rx="2" />
              <path d="M1 5h14M5 1v14M10 1v14M1 10h14" />
            </svg>
          ),
        },
        {
          id: "consultants",
          label: "Tanácsadók",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="5" r="2.5" />
              <path d="M1.5 14a4.5 4.5 0 0 1 9 0" />
              <circle cx="11.5" cy="6" r="2" />
              <path d="M11.5 10.5a3.5 3.5 0 0 1 3 3.5" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Tartalom",
      items: isPortfolioSurfaceActive("blog")
        ? [
            {
              id: "blog" as const,
              label: "Blog",
              icon: (
                <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
                  <path d="M5 5.5h6M5 8h6M5 10.5h3.5" />
                </svg>
              ),
            },
          ]
        : [],
    },
    {
      label: "Működés",
      items: [
        {
          id: "ops",
          label: "Rendszer",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="2.5" />
              <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
            </svg>
          ),
        },
        {
          id: "legal",
          label: "Jogi dokumentumok",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 1.5h7l3 3V14.5H3Z" />
              <path d="M10 1.5v3h3M5.5 8h5M5.5 10.5h5" />
            </svg>
          ),
        },
        {
          id: "feedback",
          label: "Visszajelzések",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13.5l-4.7 2 1-5L1 7l5.1-.6L8 2l1.9 4.4L15 7l-3.3 3.5 1 5Z" />
            </svg>
          ),
        },
        {
          id: "reminders",
          label: "Emlékeztetők",
          icon: (
            <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2a4 4 0 0 1 4 4v2.5l1.5 2.5h-11L4 8.5V6a4 4 0 0 1 4-4ZM6.5 13a1.5 1.5 0 0 0 3 0" />
            </svg>
          ),
        },
      ],
    },
  ];
  return groups.filter((group) => group.items.length > 0);
}

function Badge({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={`ml-auto rounded-full px-1.5 py-0.5 text-micro font-semibold leading-none ${
        // bronze-dark, nem bronze: a 10 px-es szám a kártyalapon 2,9:1-et
        // adott, a mélyebb árnyalat 4,9:1-re hozza (mindkét színsémán).
        active ? "bg-surface-card text-bronze-dark" : "bg-state-warning-bg text-state-warning-fg"
      }`}
    >
      {value}
    </span>
  );
}

export function AdminNav({
  active,
  newInquiryCount = 0,
  crmDueCount = 0,
}: {
  active: AdminTabId;
  newInquiryCount?: number;
  crmDueCount?: number;
}) {
  const groups = buildGroups(newInquiryCount, crmDueCount);
  const flat = groups.flatMap((g) => g.items);

  return (
    <>
      {/* ═══ Mobil / tablet: görgethető pill-sor ═══ */}
      <nav
        aria-label="Admin navigáció"
        className="lg:hidden -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max gap-1.5 rounded-xl border border-sand bg-surface-card p-1.5">
          {flat.map((item) => {
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={`/admin?tab=${item.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[42px] snap-start items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-bronze text-[var(--color-text-on-accent)] shadow-sm"
                    : "text-muted hover:bg-cream hover:text-ink"
                }`}
              >
                {item.label}
                {item.badge !== undefined ? (
                  <Badge value={item.badge} active={isActive} />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ═══ Desktop: oldalsáv ═══ */}
      <nav
        aria-label="Admin navigáció"
        className="hidden lg:block lg:sticky lg:top-20 lg:self-start"
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-sand bg-surface-card p-3">
          {groups.map((group, gi) => (
            <div key={group.label ?? gi}>
              {group.label ? (
                <p className="px-2.5 pb-1.5 font-mono text-micro uppercase tracking-widest text-muted">
                  {group.label}
                </p>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/admin?tab=${item.id}`}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-[40px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-bronze text-[var(--color-text-on-accent)] shadow-sm"
                          : "text-ink-body hover:bg-cream hover:text-ink"
                      }`}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined ? (
                        <Badge value={item.badge} active={isActive} />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
