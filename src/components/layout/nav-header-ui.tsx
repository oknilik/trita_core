"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { clearLocaleSyncFlag, useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
import { NotificationsProvider } from "./NotificationsProvider";

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
    <svg className="ml-0.5 h-2.5 w-2.5 text-[var(--color-text-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-canvas)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-border-default)] group-hover:text-[var(--color-text-secondary)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="text-[11px] leading-snug text-[var(--color-text-muted)]">{desc}</p>
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
  const { locale } = useLocale();

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
  async function switchTeam(teamId: string) {
    try {
      await fetch("/api/team/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
    } catch {
      // a kijelölés ilyenkor marad a régi — a navigáció mehet tovább
    }
    router.refresh();
  }

  const homePath = homeHref.split("?")[0] ?? homeHref;
  const activeTab = searchParams.get("tab");
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

  useEffect(() => {
    setMobileMenu("closed");
    setOpenDropdown(null);
  }, [pathname, searchParams]);

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
  if (pathname.startsWith("/try") || pathname.startsWith("/assessment")) {
    return (
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[rgba(250,249,246,0.95)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link
            href={homeHref}
            aria-label="trita"
            className="font-fraunces text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]"
          >
            <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
          </Link>
          <Link
            href={homeHref}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-caption font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-canvas)] hover:text-[var(--color-text-primary)]"
          >
            <span aria-hidden="true">←</span>
            {t("nav.backToHome", locale)}
          </Link>
        </div>
      </header>
    );
  }

  const navItemBase =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-caption font-medium transition-all cursor-pointer select-none rounded-lg";
  const navItemActive = `${navItemBase} bg-[var(--color-surface-subtle)] text-[var(--color-accent-primary)] font-semibold`;
  const navItemInactive =
    `${navItemBase} text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-canvas)]`;

  function getItemIcon(itemId: WorkspaceNavItem["id"], className?: string) {
    switch (itemId) {
      case "home":
        return <GridIcon className={className} />;
      case "results":
        return <ResultsIcon className={className} />;
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
        <div className="rounded-xl bg-white/80 px-3.5 py-3">
          <p className="truncate text-caption font-semibold text-[var(--color-text-primary)]">
            {displayName ?? "Saját profil"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{roleLabel}</p>
        </div>

        <div className="mt-1 rounded-xl bg-white px-2 py-2">
          {showProfileMenuItem ? (
            <>
              <Link
                href="/profile"
                onClick={closeAll}
                data-testid="nav-user-menu-profile"
                className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2.5 14a5.5 5.5 0 0 1 11 0" />
                  </svg>
                </span>
                <span>Profil beállítások</span>
              </Link>

              <Link
                href="/profile/results"
                onClick={closeAll}
                data-testid="nav-user-menu-results"
                className="mt-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 13.5h12" />
                    <path d="M4 10V6.5" />
                    <path d="M8 10V3.5" />
                    <path d="M12 10V8" />
                  </svg>
                </span>
                <span>Eredményeim</span>
              </Link>
            </>
          ) : null}

          {orgMemberships && orgMemberships.length > 1 ? (
            <div className="mt-1 rounded-lg px-2.5 py-2.5">
              <p className="pb-2 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
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
                      className={`flex min-h-[38px] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors ${
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
              className="mt-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
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
              className="mt-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-caption font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </span>
              <span>Új ügyfél-szervezet</span>
            </Link>
          ) : null}

          {showLanguageMenuItem ? (
            <div className="mt-1 rounded-lg px-2.5 py-2.5">
              <p className="pb-2 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                Nyelv
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
                  signOut({ redirectUrl: "/" });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-caption font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" />
                  </svg>
                </span>
                <span>Kijelentkezés</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );

  return (
    <>
      {openDropdown && <div className="fixed inset-0 z-30" onClick={closeAll} />}

      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[rgba(250,249,246,0.95)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[12px]">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr_auto] items-center px-5 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <Link
            href={homeHref}
            aria-label="trita"
            className="font-fraunces justify-self-start text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]"
          >
            <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex lg:justify-self-center">
            {navItems.map((item, index) => {
              const isActive = isNavItemActive(item);
              const itemClass =
                item.id === "home"
                  ? `${isActive ? "rounded-lg bg-[var(--color-text-primary)] text-white px-4 py-1.5 text-caption font-medium inline-flex items-center gap-2" : navItemInactive}`
                  : isActive || openDropdown === item.id
                    ? navItemActive
                    : navItemInactive;

              return (
                <div key={item.id} className="contents">
                  {index > 0 && item.id === "org" ? (
                    <div className="mx-2 h-5 w-px bg-[var(--color-border-soft)]" />
                  ) : null}

                  {item.kind === "link" ? (
                    <Link
                      href={item.primaryHref}
                      data-testid={`nav-item-${item.id}`}
                      className={itemClass}
                    >
                      {getItemIcon(item.id, "h-3.5 w-3.5")}
                      {item.label}
                      {item.badge ? (
                        <span className="ml-0.5 rounded-full bg-[var(--color-text-primary)] px-1.5 py-[1px] font-mono text-micro text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        data-testid={`nav-item-${item.id}`}
                        className={itemClass}
                        onClick={() => toggle(item.id)}
                      >
                        {getItemIcon(item.id, "h-3.5 w-3.5")}
                        {item.label}
                        {item.badge ? (
                          <span className="ml-0.5 rounded-full bg-[var(--color-text-primary)] px-1.5 py-[1px] font-mono text-micro text-white">
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
                                void switchTeam(child.id.slice("team-".length));
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

          <div className="hidden items-center gap-2 lg:flex lg:justify-self-end">
            <div className="h-5 w-px bg-[var(--color-border-default)]" />
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
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-white py-0.5 pl-1 pr-2.5 transition hover:border-[var(--color-text-muted)]"
              >
                {showIdentityLoader ? (
                  <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                  >
                    {initial}
                  </div>
                )}
                {showIdentityLoader ? (
                  <span className="h-2.5 w-20 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
                ) : (
                  <span className="max-w-[90px] truncate text-[12px] font-medium text-[var(--color-text-secondary)]">
                    {displayName ?? "Profil"}
                  </span>
                )}
                <ChevronDown />
              </button>
              {userDropdown}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-self-end lg:hidden">
            <div className="relative">
              <NotificationBell
                isOpen={openDropdown === "notifications"}
                onToggle={() => toggle("notifications")}
              />
              {openDropdown === "notifications" && (
                <NotificationPanel onClose={() => setOpenDropdown(null)} />
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                // A mobil menü is mutatja az org-váltót — lusta betöltés.
                ensureOrgMemberships();
                setMobileMenu((prev) => (prev === "closed" ? "open" : "closed"));
              }}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--color-text-primary)]"
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
      <MobileMenuShell open={mobileMenu !== "closed"} onClose={() => setMobileMenu("closed")}>
        <>
                <div className="flex items-center gap-3 border-b border-[var(--color-border-default)] px-4 py-3">
                  <Link
                    href={homeDestination}
                    onClick={() => setMobileMenu("closed")}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-caption font-medium text-white"
                  >
                    <GridIcon className="h-3.5 w-3.5" />
                    {homeLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenu("closed")}
                    className="flex min-h-[44px] items-center gap-1.5 px-2 text-caption text-[var(--color-text-muted)]"
                  >
                    Bezárás
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 8l4-4 4 4" />
                    </svg>
                  </button>
                </div>

                <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3">
                  {showIdentityLoader ? (
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/70" />
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
                      <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/70" />
                      <div className="h-2 w-14 animate-pulse rounded-full bg-white/70" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{displayName ?? "Profil"}</p>
                      <p className="text-[12px] text-[var(--color-text-muted)]">{roleLabel}</p>
                    </div>
                  )}
                </div>

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
                          <MobileMenuSectionLabel>{item.label}</MobileMenuSectionLabel>
                          {item.items?.map((child) => (
                            <MobileMenuRow
                              key={child.id}
                              href={child.href}
                              icon={getItemIcon(item.id, "h-4 w-4")}
                              title={child.label}
                              desc={child.description}
                              onClick={() => {
                                setMobileMenu("closed");
                                if (item.id === "teams" && child.id.startsWith("team-")) {
                                  void switchTeam(child.id.slice("team-".length));
                                }
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  ))}

                {showProfileMenuItem || showLanguageMenuItem ? (
                  <div className="mt-4 border-t border-[var(--color-border-soft)] px-4 pb-1 pt-4">
                    <p className="pb-1.5 font-fraunces text-[16px] text-[var(--color-text-primary)]">
                      Fiók
                    </p>
                    {showProfileMenuItem ? (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenu("closed")}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="8" cy="5" r="3" />
                              <path d="M2.5 14a5.5 5.5 0 0 1 11 0" />
                            </svg>
                          </span>
                          <span>Profil beállítások</span>
                        </Link>

                        <Link
                          href="/profile/results"
                          onClick={() => setMobileMenu("closed")}
                          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 13.5h12" />
                              <path d="M4 10V6.5" />
                              <path d="M8 10V3.5" />
                              <path d="M12 10V8" />
                            </svg>
                          </span>
                          <span>Eredményeim</span>
                        </Link>
                      </>
                    ) : null}

                    {/* Org-váltó mobilon is (bugfix): több tagságnál eddig
                        csak a desktop user-dropdownban lehetett szervezetet
                        váltani — a mobilmenüből teljesen hiányzott. */}
                    {orgMemberships && orgMemberships.length > 1 ? (
                      <div className="mt-1 rounded-lg px-3 py-3">
                        <p className="pb-1.5 font-fraunces text-[16px] text-[var(--color-text-primary)]">
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
                                className={`flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors ${
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
                        className="mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
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
                            signOut({ redirectUrl: "/" });
                            setMobileMenu("closed");
                          }}
                          className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-white text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                        >
                          Kijelentkezés
                        </button>
                      </div>
                    ) : null}

                    {showLanguageMenuItem ? (
                      <div className="rounded-lg px-3 py-3">
                        <p className="pb-1.5 font-fraunces text-[16px] text-[var(--color-text-primary)]">
                          Nyelv
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
