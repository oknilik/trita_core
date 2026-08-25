"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { clearLocaleSyncFlag, useLocale } from "@/components/LocaleProvider";
import { useAuthState } from "@/components/auth/auth-state";
import { t } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TritaWordmark } from "@/components/TritaLogo";
import { AssessmentFocusHeader } from "@/components/layout/AssessmentFocusHeader";
import {
  buildWorkspaceNavigation,
  resolveWorkspaceNavRole,
  type WorkspaceNavItem,
} from "@/lib/navigation/config";
import { getUserMenuItemIds } from "@/lib/navigation/visibility";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import { isConsultingLed } from "@/lib/operating-mode";
import { MobileMenuShell, MobileMenuRow, MobileMenuSectionLabel } from "./mobile-menu";
import { NotificationBell } from "./NotificationBell";
import { NotificationPanel } from "./NotificationPanel";
import { NotificationsProvider, useNotifications } from "./NotificationsProvider";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { BackControl } from "@/components/ui/primitives/BackControl";

function GridIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function ResultsIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13.5h12" />
      <path d="M4 10V6.5" />
      <path d="M8 10V3.5" />
      <path d="M12 10V8" />
    </svg>
  );
}

function InteractionIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="5" r="2.25" />
      <circle cx="11" cy="5" r="2.25" />
      <path d="M1.5 14a3.5 3.5 0 0 1 7 0" />
      <path d="M7.5 14a3.5 3.5 0 0 1 7 0" />
      <path d="M6.5 8.5h3" />
    </svg>
  );
}

function TasksIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4.5l1.5 1.5 2.5-2.5" />
      <path d="M2.5 11.5l1.5 1.5 2.5-2.5" />
      <path d="M9 4.5h4.5" />
      <path d="M9 11.5h4.5" />
    </svg>
  );
}

function TeamIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1.5 14a4.5 4.5 0 0 1 9 0" />
      <circle cx="11.5" cy="6" r="2" />
      <path d="M11.5 10.5a3.5 3.5 0 0 1 3 3.5" />
    </svg>
  );
}

function ReportIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13.5h12" />
      <path d="M4 10V6.5" />
      <path d="M8 10V3.5" />
      <path d="M12 10V8" />
    </svg>
  );
}

function CandidateIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="5" r="3" />
      <path d="M2 14a5 5 0 0 1 10 0" />
      <path d="M12 5l1.5 1.5L16 4" />
    </svg>
  );
}

function OrgIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="14" height="14" rx="2" />
      <path d="M1 5h14M5 1v14M10 1v14M1 10h14" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg className="ml-0.5 h-2.5 w-2.5 text-current opacity-70" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

function MegaItem({
  href,
  icon,
  title,
  desc,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-canvas)] ${FOCUS_RING_CLASS}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-border-default)] group-hover:text-[var(--color-text-secondary)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="text-note leading-snug text-[var(--color-text-muted)]">{desc}</p>
      </div>
      <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-border-soft)] transition-colors group-hover:text-[var(--color-text-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 2l4 4-4 4" />
      </svg>
    </Link>
  );
}

interface NavHeaderUIProps {
  user: { username: string | null; email: string | null };
  org: { id: string; name: string } | null;
  teams: Array<{ id: string; name: string }>;
  homeHref: string;
  role: string;
  activeCampaignCount: number;
  /** Nyitott meresi feladatok szama (badge a Feladataim menun). */
  openTaskCount?: number;
  hasHiringAccess: boolean;
  /** Org-szintű kapcsoló: rejtve van-e a karrier-iránytű. */
  careerModuleHidden?: boolean;
  /** Platform-admin (ADMIN_EMAILS) — az Admin vezérlő menüpont kapuja. */
  isPlatformAdmin?: boolean;
  /** Szerverről jövő kezdőérték — így a harang mountkor nem hív API-t. */
  unreadNotificationCount?: number;
}

/**
 * A harang és a panel két helyen renderelődik (desktop + mobil ág), ezért a
 * notification-állapot egy providerben él — egy poll, egy lista-lekérés.
 */
// Modul-szinten deklarálva: a szülő testében minden render új komponens-
// típust adott, ami a nyitott lenyílót le- és újraszerelte (animáció-újrafutás).
function MegaDropdown({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
  if (!isOpen) return null;
  return (
    <div
    className="absolute left-0 top-[calc(100%+4px)] z-50 w-[380px] overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] p-1.5 shadow-lg shadow-black/[0.04]"
    style={{ animation: "fade-in 150ms ease-out" }}
    >
    {children}
    </div>
  );
}


export function NavHeaderUI({
  unreadNotificationCount = 0,
  ...props
}: NavHeaderUIProps) {
  return (
    <NotificationsProvider initialCount={unreadNotificationCount}>
      <NavHeaderContent {...props} />
    </NotificationsProvider>
  );
}

function NavHeaderContent({
  user,
  org,
  teams,
  homeHref,
  role,
  activeCampaignCount,
  openTaskCount = 0,
  hasHiringAccess,
  careerModuleHidden,
  isPlatformAdmin = false,
}: Omit<NavHeaderUIProps, "unreadNotificationCount">) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signOut } = useClerk();
  const { markSignedOut } = useAuthState();
  const { locale } = useLocale();
  const { count: notificationCount, ensureList: ensureNotificationList } = useNotifications();

  type DropdownKey = WorkspaceNavItem["id"] | "user" | "notifications" | null;
  // Egy menüszint (UX-audit #26): a korábbi quickview→expanded kétlépcső
  // plusz koppintást és tanulást kért — a hamburger egyből a teljes menüt nyitja.
  type MobileMenuState = "closed" | "open";

  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [mobileMenu, setMobileMenu] = useState<MobileMenuState>("closed");
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(user.username ?? null);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(user.email ?? null);
  const [identityReady, setIdentityReady] = useState<boolean>(() => Boolean(user.username || user.email));
  const router = useRouter();

  // Org-váltó: több tagságnál (pl. tanácsadó több kliens-szervezetben)
  type OrgMembershipEntry = { orgId: string; role: string; orgName: string | null };
  const [orgMemberships, setOrgMemberships] = useState<OrgMembershipEntry[] | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(org?.id ?? null);
  const [orgSwitchBusy, setOrgSwitchBusy] = useState(false);

  // Az org-váltó tagság-listája LUSTÁN töltődik: korábban minden oldal-
  // betöltésnél lement egy /api/org/context hívás, pedig a legtöbb user egy
  // szervezetben van és sosem nyitja meg a váltót. Most a lenyíló első
  // megnyitása tölti be (egyszer, majd cache-elve a komponens élettartamára).
  const orgMembershipsLoading = useRef(false);
  const ensureOrgMemberships = useCallback(() => {
    if (!org || orgMemberships !== null || orgMembershipsLoading.current) return;
    orgMembershipsLoading.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/org/context");
        if (!res.ok) return;
        const data = await res.json();
        setOrgMemberships(data.memberships ?? []);
        setActiveOrgId(data.activeOrgId ?? org.id);
      } catch {
        // a váltó ilyenkor egyszerűen nem jelenik meg
      } finally {
        orgMembershipsLoading.current = false;
      }
    })();
  }, [org, orgMemberships]);

  async function switchOrg(targetOrgId: string, targetRole: string) {
    if (orgSwitchBusy || targetOrgId === activeOrgId) return;
    setOrgSwitchBusy(true);
    try {
      const res = await fetch("/api/org/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: targetOrgId }),
      });
      if (!res.ok) return;
      setActiveOrgId(targetOrgId);
      setOpenDropdown(null);
      // Manager+ szerep az org cockpitra megy, tag a journey elosztóra.
      const destination =
        targetRole === "ORG_MEMBER" ? "/dashboard" : `/org/${targetOrgId}`;
      router.push(destination);
      router.refresh();
    } finally {
      setOrgSwitchBusy(false);
    }
  }

  // Csapat-váltás a nav-menüből: a kijelölt csapat perzisztens (a Vezérlő
  // ezután ide visz). A navigáció akkor is megtörténik, ha a mentés elhasal.
  /**
   * Aktív csapat kijelölése a Csapatok-menüből.
   *
   * MINDKÉT hívási helye egy `<Link>`-en ül, ami közben a csapatoldalra
   * navigál — ezért itt SEM `await`, SEM `router.refresh()` nincs:
   *
   *  – A `refresh()` a JELENLEGI útvonalat rendereli újra. Amíg a POST
   *    válaszára vártunk, a Link navigációja már elindult, és a beérkező
   *    refresh visszarántotta a felhasználót arra az oldalra, ahonnan a
   *    menüt nyitotta. Az org-oldalról indulva ez pontosan úgy nézett ki,
   *    mintha a menü a szervezetre vinne — mobilon a lassabb hálózat miatt
   *    szinte mindig ez nyert (2026-08-09).
   *  – A frissítés amúgy is felesleges: a cél-oldal a navigációval újra
   *    renderel, a csapatoldal pedig URL-ből azonosítja a csapatot, nem a
   *    kijelölt kontextusból.
   *
   * `keepalive`: a kérésnek túl kell élnie a lapváltást, különben a
   * kijelölés elveszne, ha a navigáció hamarabb kész, mint a POST.
   */
  function switchTeam(teamId: string) {
    void fetch("/api/team/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
      keepalive: true,
    }).catch(() => {
      // A kijelölés ilyenkor marad a régi — a navigáció mehet tovább.
    });
  }

  const homePath = homeHref.split("?")[0] ?? homeHref;
  const activeTab = searchParams.get("tab");

  /**
   * Épp ezen a célponton állunk-e? A menü-hivatkozások `?tab=` paraméterrel
   * jönnek, az útvonal-egyezéshez viszont csak a path számít — a csapatoldal
   * bármelyik fülén állva ugyanaz a csapat az aktív.
   */
  function isMobileChildActive(href: string): boolean {
    return pathname === (href.split("?")[0] ?? href);
  }
  const navRole = resolveWorkspaceNavRole(role);
  const navItems = buildWorkspaceNavigation(navRole, {
    homeHref,
    org,
    teams,
    hasHiringAccess,
    careerModuleHidden,
    activeCampaignCount,
    openTaskCount,
  }, locale);
  const homeItem = navItems.find((item) => item.id === "home");
  const homeLabel = homeItem?.label ?? t("nav.home", locale);
  const homeDestination = homeItem?.primaryHref ?? homeHref;
  const onHome =
    homePath === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(homePath);

  const refreshIdentity = useCallback(async () => {
    setIdentityReady(false);
    try {
      const res = await fetch("/api/profile/onboarding");
      if (!res.ok) return;
      const data = await res.json();
      setResolvedUsername(data?.username ?? null);
      setResolvedEmail(data?.email ?? user.email ?? null);
    } catch {
      // noop
    } finally {
      setIdentityReady(true);
    }
  }, [user.email]);

  const displayName = resolvedUsername || resolvedEmail || null;
  const showIdentityLoader = !identityReady;
  const initial = getAvatarMonogram(displayName, { length: 1, fallback: "P" });
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName ?? "trita");
  const baseRoleLabel =
    role === "ORG_ADMIN"
      ? "Admin"
      : role === "ORG_CONSULTANT"
        ? "Tanácsadó"
        : role === "ORG_MANAGER"
          ? "Manager"
          : "Felhasználó";
  const roleLabel = org ? `${baseRoleLabel} · ${org.name}` : baseRoleLabel;
  const userMenuItems = new Set(getUserMenuItemIds());
  const showProfileMenuItem = userMenuItems.has("profile");
  const showLanguageMenuItem = userMenuItems.has("language");
  const showSignOutMenuItem = userMenuItems.has("sign_out");

  const closeAll = useCallback(() => setOpenDropdown(null), []);

  const toggle = useCallback(
    (key: DropdownKey) => {
      // A user-menü tartalmazza az org-váltót és a tanácsadói „új ügyfél-org"
      // linket — a tagság-listát itt töltjük be, nem mountkor.
      if (key === "user") ensureOrgMemberships();
      setOpenDropdown((prev) => (prev === key ? null : key));
    },
    [ensureOrgMemberships],
  );

  // A nyitott menüt CSAK valódi navigációra zárjuk. A useSearchParams()
  // minden router-frissítéskor ÚJ objektum-identitást ad (akkor is, ha a
  // query változatlan), így a puszta referencia-figyelés egy háttérben
  // befutó re-render miatt is becsukta a lenyílót — a felhasználó keze
  // alól tűnt el a menüpont (CI-ben E2E-bukásként jelent meg). A query
  // szöveges alakja stabil: csak tényleges változásra fut le.
  const searchParamsKey = searchParams.toString();
  useEffect(() => {
    setMobileMenu("closed");
    setOpenDropdown(null);
  }, [pathname, searchParamsKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeAll]);

  useEffect(() => {
    if (identityReady) return;
    const timer = window.setTimeout(() => {
      void refreshIdentity();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [identityReady, refreshIdentity]);

  useEffect(() => {
    const handler = () => {
      void refreshIdentity();
    };
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [refreshIdentity]);

  // Fókusz-mód a kitöltő felületeken: a teljes navigáció zavaró lenne,
  // de vissza-út mindig kell (design-akciólista #3) — minimál fejléc:
  // logó + „Vissza a vezérlőre" link.
  // A fő self-kitöltő a valós idejű progressz miatt saját kapszulát rajzol.
  // Az assessment alfolyamok továbbra is ezt a shell-fejlécet használják.
  if (
    pathname === "/try" ||
    pathname === "/assessment" ||
    pathname === "/observe" ||
    pathname.startsWith("/observe/")
  ) {
    return null;
  }

  if (pathname.startsWith("/try") || pathname.startsWith("/assessment")) {
    return (
      <AssessmentFocusHeader homeHref={homeHref}>
        <BackControl
          href={homeHref}
          label={t("nav.backToHome", locale)}
          labelClassName="hidden sm:inline"
        />
      </AssessmentFocusHeader>
    );
  }

  // Egységes kapszula: minden célpont ugyanazt az aktív állapotot kapja.
  // Korábban a Vezérlő sötét pill, a többi menüpont pedig világos, akcent
  // feliratos chip volt, ezért egyszerre két aktív navigációs nyelv élt.
  const navItemBase =
    `inline-flex min-h-9 items-center gap-1.5 rounded-[10px] px-3 text-caption font-medium transition-[color,background-color,box-shadow] cursor-pointer select-none ${FOCUS_RING_CLASS}`;
  const navItemActive = `${navItemBase} bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)] font-semibold shadow-[0_3px_10px_rgba(26,26,46,0.14)]`;
  const navItemInactive = `${navItemBase} text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card)] hover:text-[var(--color-text-primary)]`;

  function getItemIcon(itemId: WorkspaceNavItem["id"], className?: string) {
    switch (itemId) {
      case "home":
        return <GridIcon className={className} />;
      case "results":
        return <ResultsIcon className={className} />;
      case "interaction":
        return <InteractionIcon className={className} />;
      case "tasks":
        return <TasksIcon className={className} />;
      case "teams":
        return <TeamIcon className={className} />;
      case "hiring":
        return <CandidateIcon className={className} />;
      case "org":
        return <OrgIcon className={className} />;
      case "analytics":
        return <ReportIcon className={className} />;
    }
  }

  function isNavItemActive(item: WorkspaceNavItem): boolean {
    const currentPathWithQuery = activeTab ? `${pathname}?tab=${activeTab}` : pathname;
    const matchesPrefix = (prefix: string) => {
      if (prefix.includes("?")) {
        if (currentPathWithQuery === prefix) return true;
        // Org overview is the implicit default when no `tab` query is present.
        if (prefix.endsWith("?tab=overview") && activeTab == null) {
          return pathname === prefix.split("?")[0];
        }
        return false;
      }
      return pathname.startsWith(prefix);
    };

    switch (item.id) {
      case "home":
        return onHome;
      case "teams":
        return teams.some((team) => pathname.startsWith(`/team/${team.id}`)) && activeTab !== "profile";
      case "analytics":
        return item.matchPrefixes.some(matchesPrefix);
      case "hiring":
        return org ? pathname.startsWith(`/hiring/${org.id}`) : false;
      case "org":
        return item.matchPrefixes.some(matchesPrefix);
      default:
        return item.matchPrefixes.some(matchesPrefix);
    }
  }

  // FONTOS: ez NEM komponens, hanem JSX-változó.
  //
  // Komponensként (a szülő testében deklarálva) minden szülő-render új
  // függvény-identitást adott neki, ezért React más TÍPUSKÉNT látta: a nyitott
  // menüt leszerelte és újra felépítette, a `fade-in` animáció pedig újra
  // lefutott — ez volt a kattintás utáni „ugrás". Változóként a nyitott menü
  // ugyanaz a DOM-részfa marad.
  const userDropdown =
    openDropdown !== "user" ? null : (
      <div
        className="absolute right-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] p-1.5 shadow-lg shadow-black/[0.04]"
        style={{ animation: "fade-in 150ms ease-out" }}
      >
        <div className="rounded-xl bg-[var(--color-surface-card)]/80 px-3.5 py-3">
          <p className="truncate text-caption font-semibold text-[var(--color-text-primary)]">
            {displayName ?? "Saját profil"}
          </p>
          <p className="mt-0.5 text-note text-[var(--color-text-muted)]">{roleLabel}</p>
        </div>

        <div className="mt-1 rounded-xl bg-surface-card px-2 py-2">
          {showProfileMenuItem ? (
            <>
              <Link
                href="/profile"
                onClick={closeAll}
                data-testid="nav-user-menu-profile"
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2.5 14a5.5 5.5 0 0 1 11 0" />
                  </svg>
                </span>
                <span>{t("nav.profileSettings", locale)}</span>
              </Link>

              <Link
                href="/profile/results"
                onClick={closeAll}
                data-testid="nav-user-menu-results"
                className={`mt-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 13.5h12" />
                    <path d="M4 10V6.5" />
                    <path d="M8 10V3.5" />
                    <path d="M12 10V8" />
                  </svg>
                </span>
                <span>{t("nav.results", locale)}</span>
              </Link>
            </>
          ) : null}

          {orgMemberships && orgMemberships.length > 1 ? (
            <div className="mt-1 rounded-lg px-2.5 py-2.5">
              <p className="pb-2 text-label uppercase text-[var(--color-text-muted)]">
                Szervezeteim ({orgMemberships.length})
              </p>
              <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1" data-testid="nav-org-switcher">
                {orgMemberships.map((m) => {
                  const isActive = m.orgId === activeOrgId;
                  return (
                    <button
                      key={m.orgId}
                      type="button"
                      disabled={orgSwitchBusy}
                      onClick={() => switchOrg(m.orgId, m.role)}
                      className={`flex min-h-[38px] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${FOCUS_RING_CLASS} ${
                        isActive
                          ? "bg-[var(--color-surface-subtle)] font-semibold text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
                      } disabled:opacity-50`}
                    >
                      <span className="truncate">{m.orgName ?? m.orgId}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-full bg-[var(--color-surface-canvas)] px-1.5 py-0.5 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                          {m.role === "ORG_ADMIN"
                            ? "Admin"
                            : m.role === "ORG_CONSULTANT"
                              ? "Tanácsadó"
                              : m.role === "ORG_MANAGER"
                                ? "Manager"
                                : "Tag"}
                        </span>
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-primary-bg)]" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Platform-admin belépő — az org-váltó alatt, csak ADMIN_EMAILS usernek */}
          {isPlatformAdmin ? (
            <Link
              href="/admin"
              onClick={closeAll}
              data-testid="nav-admin-dashboard"
              className={`mt-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="5" height="5" rx="1" />
                  <rect x="9" y="2" width="5" height="5" rx="1" />
                  <rect x="2" y="9" width="5" height="5" rx="1" />
                  <rect x="9" y="9" width="5" height="5" rx="1" />
                </svg>
              </span>
              <span>{t("nav.adminConsole", locale)}</span>
            </Link>
          ) : null}

          {/* Tanácsadói ügyfél-org létrehozás — csak consulting-led módban */}
          {isConsultingLed() &&
          orgMemberships?.some((m) => m.role === "ORG_CONSULTANT") ? (
            <Link
              href="/org/new"
              onClick={closeAll}
              data-testid="nav-new-client-org"
              className={`mt-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </span>
              <span>{t("nav.newClientOrg", locale)}</span>
            </Link>
          ) : null}

          {showLanguageMenuItem ? (
            <div className="mt-1 rounded-lg px-2.5 py-2.5">
              <p className="pb-2 text-label uppercase text-[var(--color-text-muted)]">
                {t("nav.language", locale)}
              </p>
              <LanguageSwitcher variant="pills" />
            </div>
          ) : null}

          {showSignOutMenuItem ? (
            <div className="mt-1 border-t border-[var(--color-border-soft)] pt-1">
              <button
                type="button"
                onClick={() => {
                  closeAll();
                  clearLocaleSyncFlag();
                  const signOutPromise = signOut({ redirectUrl: "/" });
                  markSignedOut();
                  void signOutPromise;
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-caption font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] ${FOCUS_RING_CLASS}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" />
                  </svg>
                </span>
                <span>{t("nav.signOut", locale)}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );

  return (
    <>
      {openDropdown && <div className="fixed inset-0 z-30" onClick={closeAll} />}

      <header
        data-testid="workspace-nav-header"
        data-compact="false"
        className="sticky top-0 z-40 bg-transparent"
      >
        <div
          className="mx-auto mt-2 grid h-14 w-[calc(100%-1.5rem)] max-w-[1280px] grid-cols-[1fr_auto] items-center rounded-[19px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 px-3 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] sm:px-4 lg:mt-3 lg:h-[68px] lg:grid-cols-[1fr_auto_1fr] lg:rounded-[22px] lg:px-5"
        >
          <Link
            href={homeHref}
            aria-label="trita"
            className={`pointer-events-auto justify-self-start rounded-md text-[var(--color-text-primary)] ${FOCUS_RING_CLASS}`}
          >
            <TritaWordmark className="text-heading tracking-[-0.04em]" />
          </Link>

          <nav
            aria-label={t("nav.menu", locale)}
            className="pointer-events-auto hidden items-center gap-1 rounded-[15px] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-1 shadow-[0_1px_2px_rgba(26,26,46,0.04)] lg:flex lg:justify-self-center"
          >
            {navItems.map((item, index) => {
              const isActive = isNavItemActive(item);
              const isHighlighted = isActive || openDropdown === item.id;
              const itemClass = isHighlighted ? navItemActive : navItemInactive;
              const badgeClass = isHighlighted
                ? "bg-[var(--color-surface-card)] text-[var(--color-text-primary)]"
                : "bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]";

              return (
                <div key={item.id} className="contents">
                  {index > 0 && item.id === "org" ? (
                    <div className="mx-1 h-6 w-px bg-[var(--color-border-default)]" />
                  ) : null}

                  {item.kind === "link" ? (
                    <Link
                      href={item.primaryHref}
                      data-testid={`nav-item-${item.id}`}
                      aria-current={isActive ? "page" : undefined}
                      className={itemClass}
                    >
                      {getItemIcon(item.id, "h-3.5 w-3.5")}
                      {item.label}
                      {item.badge ? (
                        <span className={`ml-0.5 rounded-full px-1.5 py-[1px] font-mono text-micro ${badgeClass}`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        data-testid={`nav-item-${item.id}`}
                        aria-expanded={openDropdown === item.id}
                        aria-current={isActive ? "page" : undefined}
                        className={itemClass}
                        onClick={() => toggle(item.id)}
                      >
                        {getItemIcon(item.id, "h-3.5 w-3.5")}
                        {item.label}
                        {item.badge ? (
                          <span className={`ml-0.5 rounded-full px-1.5 py-[1px] font-mono text-micro ${badgeClass}`}>
                            {item.badge}
                          </span>
                        ) : null}
                        <ChevronDown />
                      </button>
                      <MegaDropdown isOpen={openDropdown === item.id}>
                        {item.items?.map((child) => (
                          <MegaItem
                            key={child.id}
                            href={child.href}
                            icon={getItemIcon(item.id)}
                            title={child.label}
                            desc={child.description}
                            onClick={() => {
                              closeAll();
                              if (item.id === "teams" && child.id.startsWith("team-")) {
                                switchTeam(child.id.slice("team-".length));
                              }
                            }}
                          />
                        ))}
                      </MegaDropdown>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="pointer-events-auto hidden items-center gap-2 lg:flex lg:justify-self-end">
            <div className="relative">
              <NotificationBell
                isOpen={openDropdown === "notifications"}
                onToggle={() => toggle("notifications")}
              />
              {openDropdown === "notifications" && (
                <NotificationPanel onClose={() => setOpenDropdown(null)} />
              )}
            </div>
            <div className="relative">
              <button
                // A tagság-listát már a gomb fölé éréskor / fókuszkor
                // betöltjük: kattintáskor indítva a válasz a MEGNYITOTT menübe
                // érkezett, és az org-váltó blokk utólag nőtt bele — ez volt a
                // másik oka a „megugrik" érzésnek. A hívás továbbra is
                // egyszer fut le (ensureOrgMemberships őrzi).
                onPointerEnter={ensureOrgMemberships}
                onFocus={ensureOrgMemberships}
                type="button"
                onClick={() => toggle("user")}
                data-testid="nav-user-menu-trigger"
                aria-expanded={openDropdown === "user"}
                className={`flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-surface-card py-0.5 pl-1 pr-3 shadow-[0_1px_2px_rgba(26,26,46,0.03)] transition-[border-color,background-color] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
              >
                {showIdentityLoader ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-note font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                  >
                    {initial}
                  </div>
                )}
                {showIdentityLoader ? (
                  <span className="h-2.5 w-20 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
                ) : (
                  <span className="max-w-[90px] truncate text-xs font-medium text-[var(--color-text-secondary)]">
                    {displayName ?? "Profil"}
                  </span>
                )}
                <ChevronDown />
              </button>
              {userDropdown}
            </div>
          </div>

          <div className="pointer-events-auto flex justify-self-end lg:hidden">
            {openDropdown === "notifications" && (
              <NotificationPanel onClose={() => setOpenDropdown(null)} />
            )}
            <button
              type="button"
              aria-label={t("nav.menu", locale)}
              aria-expanded={mobileMenu !== "closed"}
              onClick={() => {
                // A mobil menü is mutatja az org-váltót — lusta betöltés.
                ensureOrgMemberships();
                setMobileMenu((prev) => (prev === "closed" ? "open" : "closed"));
              }}
              className={`pointer-events-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-border-default)] ${FOCUS_RING_CLASS}`}
            >
              {mobileMenu !== "closed" ? (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
                  <path d="M4 4l12 12M16 4L4 16" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="h-5 w-5">
                  <path d="M2 4h12M2 8h12M2 12h12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Egyetlen menüszint (UX-audit #26) — a közös MobileMenuShell
          kártya-panelben (menü-konvergencia: a kijelentkezett NavBar
          ugyanezt a vázat használja). */}
      <MobileMenuShell
        open={mobileMenu !== "closed"}
        onClose={() => setMobileMenu("closed")}
        label={t("nav.menu", locale)}
      >
        <>
                <div className="flex items-center gap-3 border-b border-[var(--color-border-default)] px-4 py-3">
                  <Link
                    href={homeDestination}
                    onClick={() => setMobileMenu("closed")}
                    className={`inline-flex items-center gap-2 rounded-lg bg-[var(--color-surface-inverse)] px-4 py-2 text-caption font-medium text-[var(--color-text-on-inverse)] ${FOCUS_RING_CLASS}`}
                  >
                    <GridIcon className="h-3.5 w-3.5" />
                    {homeLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenu("closed")}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-caption text-[var(--color-text-muted)] ${FOCUS_RING_CLASS}`}
                  >
                    {t("common.close", locale)}
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 8l4-4 4 4" />
                    </svg>
                  </button>
                </div>

                <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3">
                  {showIdentityLoader ? (
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--color-surface-card)]/70" />
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border-soft)] text-body font-medium text-white"
                      style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                    >
                      {initial}
                    </div>
                  )}
                  {showIdentityLoader ? (
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-24 animate-pulse rounded-full bg-[var(--color-surface-card)]/70" />
                      <div className="h-2 w-14 animate-pulse rounded-full bg-[var(--color-surface-card)]/70" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{displayName ?? "Profil"}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{roleLabel}</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    ensureNotificationList();
                    setMobileMenu("closed");
                    setOpenDropdown("notifications");
                  }}
                  className={`group mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-3.5 rounded-xl px-3.5 py-3.5 text-left transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-border-default)] group-hover:text-[var(--color-text-secondary)]">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 2a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 0 0-5-5Z" />
                      <path d="M8 16a2 2 0 0 0 4 0" />
                    </svg>
                    {notificationCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-bronze-dark)] px-1 text-micro font-bold leading-none text-[var(--color-text-on-accent-deep)]">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 text-body font-medium text-[var(--color-text-primary)]">
                    {t("notifications.bellLabel", locale)}
                  </span>
                  <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-border-soft)] transition-colors group-hover:text-[var(--color-text-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 2l4 4-4 4" />
                  </svg>
                </button>

                {/* Link-típusú nav-elem (pl. Jelöltek, Szervezet, egy-csapatos
                    Csapatom) KATTINTHATÓ sorként renderel — a dropdown-elem
                    szekció-cím + gyerek-linkek. (Bugfix: a #26-os összevonás
                    után a link-elemek csak címkeként jelentek meg.) */}
                {navItems
                  .filter((item) => item.id !== "home")
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className={index === 0 ? "mt-3" : "mt-2 border-t border-[var(--color-border-default)] pt-2"}
                    >
                      {item.kind === "link" ? (
                        <MobileMenuRow
                          href={item.primaryHref}
                          icon={getItemIcon(item.id, "h-4 w-4")}
                          title={item.label}
                          desc=""
                          onClick={() => setMobileMenu("closed")}
                        />
                      ) : (
                        <>
                          {/* Az org-váltó mintája (Szervezeteim (N) + görgethető
                              lista + aktív jelölés): mobilon a lista maga a menü,
                              nincs külön „megnyitás" lépés. A darabszám azért
                              kell, mert görgetés-korlát mellett nem látszik
                              egyszerre az összes. */}
                          <MobileMenuSectionLabel>
                            {item.items && item.items.length > 1
                              ? `${item.label} (${item.items.length})`
                              : item.label}
                          </MobileMenuSectionLabel>
                          <div className="flex max-h-72 flex-col overflow-y-auto">
                            {item.items?.map((child) => (
                              <MobileMenuRow
                                key={child.id}
                                href={child.href}
                                icon={getItemIcon(item.id, "h-4 w-4")}
                                title={child.label}
                                desc={child.description}
                                active={isMobileChildActive(child.href)}
                                onClick={() => {
                                  setMobileMenu("closed");
                                  if (item.id === "teams" && child.id.startsWith("team-")) {
                                    switchTeam(child.id.slice("team-".length));
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                {showProfileMenuItem || showLanguageMenuItem ? (
                  <div className="mt-4 border-t border-[var(--color-border-soft)] px-4 pb-1 pt-4">
                    <p className="pb-1.5 font-fraunces text-base text-[var(--color-text-primary)]">
                      {t("nav.account", locale)}
                    </p>
                    {showProfileMenuItem ? (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenu("closed")}
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="8" cy="5" r="3" />
                              <path d="M2.5 14a5.5 5.5 0 0 1 11 0" />
                            </svg>
                          </span>
                          <span>{t("nav.profileSettings", locale)}</span>
                        </Link>

                        <Link
                          href="/profile/results"
                          onClick={() => setMobileMenu("closed")}
                          className={`mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 13.5h12" />
                              <path d="M4 10V6.5" />
                              <path d="M8 10V3.5" />
                              <path d="M12 10V8" />
                            </svg>
                          </span>
                          <span>{t("nav.results", locale)}</span>
                        </Link>
                      </>
                    ) : null}

                    {/* Org-váltó mobilon is (bugfix): több tagságnál eddig
                        csak a desktop user-dropdownban lehetett szervezetet
                        váltani — a mobilmenüből teljesen hiányzott. */}
                    {orgMemberships && orgMemberships.length > 1 ? (
                      <div className="mt-1 rounded-lg px-3 py-3">
                        <p className="pb-1.5 font-fraunces text-base text-[var(--color-text-primary)]">
                          Szervezeteim ({orgMemberships.length})
                        </p>
                        <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1">
                          {orgMemberships.map((m) => {
                            const isActive = m.orgId === activeOrgId;
                            return (
                              <button
                                key={m.orgId}
                                type="button"
                                disabled={orgSwitchBusy}
                                onClick={() => {
                                  setMobileMenu("closed");
                                  void switchOrg(m.orgId, m.role);
                                }}
                                className={`flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-caption transition-colors ${FOCUS_RING_CLASS} ${
                                  isActive
                                    ? "bg-[var(--color-surface-subtle)] font-semibold text-[var(--color-text-primary)]"
                                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
                                } disabled:opacity-50`}
                              >
                                <span className="truncate">{m.orgName ?? m.orgId}</span>
                                <span className="flex shrink-0 items-center gap-1.5">
                                  <span className="rounded-full bg-[var(--color-surface-canvas)] px-1.5 py-0.5 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                                    {m.role === "ORG_ADMIN"
                                      ? "Admin"
                                      : m.role === "ORG_CONSULTANT"
                                        ? "Tanácsadó"
                                        : m.role === "ORG_MANAGER"
                                          ? "Manager"
                                          : "Tag"}
                                  </span>
                                  {isActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-primary-bg)]" />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Platform-admin belépő mobilon is — desktop-paritás. */}
                    {isPlatformAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenu("closed")}
                        className={`mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="5" height="5" rx="1" />
                            <rect x="9" y="2" width="5" height="5" rx="1" />
                            <rect x="2" y="9" width="5" height="5" rx="1" />
                            <rect x="9" y="9" width="5" height="5" rx="1" />
                          </svg>
                        </span>
                        <span>{t("nav.adminConsole", locale)}</span>
                      </Link>
                    ) : null}

                    {/* Kijelentkezés — a no-auth menü „Belépés" gombjának
                        stílusában és pozíciójában (a Nyelv-szekció előtt):
                        teljes szélességű keretes gomb, azonos anatómia. */}
                    {showSignOutMenuItem ? (
                      <div className="mt-2 border-t border-[var(--color-border-soft)] px-3 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            clearLocaleSyncFlag();
                            const signOutPromise = signOut({ redirectUrl: "/" });
                            markSignedOut();
                            void signOutPromise;
                            setMobileMenu("closed");
                          }}
                          className={`flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-surface-card text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
                        >
                          {t("nav.signOut", locale)}
                        </button>
                      </div>
                    ) : null}

                    {showLanguageMenuItem ? (
                      <div className="rounded-lg px-3 py-3">
                        <p className="pb-1.5 font-fraunces text-base text-[var(--color-text-primary)]">
                          {t("nav.language", locale)}
                        </p>
                        <LanguageSwitcher variant="pills" />
                      </div>
                    ) : null}

                  </div>
                ) : null}
        </>
      </MobileMenuShell>
    </>
  );
}
