"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  buildWorkspaceNavigation,
  resolveWorkspaceNavRole,
  type WorkspaceNavItem,
} from "@/lib/navigation/config";
import { getUserMenuItemIds } from "@/lib/navigation/visibility";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import { NotificationBell } from "./NotificationBell";
import { NotificationPanel } from "./NotificationPanel";

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
        <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</p>
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
  hasHiringAccess: boolean;
}

export function NavHeaderUI({
  user,
  org,
  teams,
  homeHref,
  role,
  activeCampaignCount,
  hasHiringAccess,
}: NavHeaderUIProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signOut } = useClerk();

  type DropdownKey = WorkspaceNavItem["id"] | "user" | "notifications" | null;
  type MobileMenuState = "closed" | "quickview" | "expanded";

  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [mobileMenu, setMobileMenu] = useState<MobileMenuState>("closed");
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(user.username ?? null);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(user.email ?? null);
  const [identityReady, setIdentityReady] = useState<boolean>(() => Boolean(user.username || user.email));

  const homePath = homeHref.split("?")[0] ?? homeHref;
  const activeTab = searchParams.get("tab");
  const navRole = resolveWorkspaceNavRole(role);
  const navItems = buildWorkspaceNavigation(navRole, {
    homeHref,
    org,
    teams,
    hasHiringAccess,
    activeCampaignCount,
  });
  const homeItem = navItems.find((item) => item.id === "home");
  const homeLabel = homeItem?.label ?? "Vezérlő";
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
    role === "ORG_ADMIN" ? "Admin" : role === "ORG_MANAGER" ? "Manager" : "Felhasználó";
  const roleLabel = org ? `${baseRoleLabel} · ${org.name}` : baseRoleLabel;
  const userMenuItems = new Set(getUserMenuItemIds());
  const showProfileMenuItem = userMenuItems.has("profile");
  const showLanguageMenuItem = userMenuItems.has("language");
  const showSignOutMenuItem = userMenuItems.has("sign_out");

  const closeAll = useCallback(() => setOpenDropdown(null), []);

  const toggle = useCallback((key: DropdownKey) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

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

  if (pathname.startsWith("/try") || pathname.startsWith("/assessment")) return null;

  const navItemBase =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all cursor-pointer select-none rounded-lg";
  const navItemActive = `${navItemBase} bg-[var(--color-surface-subtle)] text-[var(--color-accent-primary)] font-semibold`;
  const navItemInactive =
    `${navItemBase} text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-canvas)]`;

  function getItemIcon(itemId: WorkspaceNavItem["id"], className?: string) {
    switch (itemId) {
      case "home":
        return <GridIcon className={className} />;
      case "results":
        return <ResultsIcon className={className} />;
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

  function UserDropdown({ isOpen }: { isOpen: boolean }) {
    if (!isOpen) return null;
    return (
      <div
        className="absolute right-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] p-1.5 shadow-lg shadow-black/[0.04]"
        style={{ animation: "fade-in 150ms ease-out" }}
      >
        <div className="rounded-xl bg-white/80 px-3.5 py-3">
          <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
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
                className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
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
                className="mt-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
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

          {showLanguageMenuItem ? (
            <div className="mt-1 rounded-lg px-2.5 py-2.5">
              <p className="pb-2 text-[11px] font-medium uppercase tracking-[1.3px] text-[var(--color-text-muted)]">
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
                  signOut({ redirectUrl: "/" });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
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
  }

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
                  ? `${isActive ? "rounded-lg bg-[var(--color-text-primary)] text-white px-4 py-1.5 text-[13px] font-medium inline-flex items-center gap-2" : navItemInactive}`
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
                          <span className="ml-0.5 rounded-full bg-[var(--color-text-primary)] px-1.5 py-[1px] font-mono text-[9px] text-white">
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
                            onClick={closeAll}
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
              <UserDropdown isOpen={openDropdown === "user"} />
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
              onClick={() => setMobileMenu((prev) => (prev === "closed" ? "quickview" : "closed"))}
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

      {mobileMenu !== "closed" && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setMobileMenu("closed")}
            style={{ animation: "fade-in 150ms ease-out" }}
          />

          <div
            className="fixed inset-x-0 top-14 z-40 lg:hidden"
            style={{ animation: "fade-in 200ms ease-out" }}
          >
            {mobileMenu === "quickview" ? (
              <div className="mx-4 mt-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] p-4 shadow-lg shadow-black/[0.04]">
                <Link
                  href={homeDestination}
                  onClick={() => setMobileMenu("closed")}
                  className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-[13px] font-medium text-white"
                >
                  <GridIcon className="h-3.5 w-3.5" />
                  {homeLabel}
                </Link>

                <div className="flex flex-col gap-0.5">
                  {navItems
                    .filter((item) => item.id !== "home")
                    .map((item) => (
                      <Link
                        key={item.id}
                        href={item.primaryHref}
                        onClick={() => setMobileMenu("closed")}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                          {getItemIcon(item.id, "h-3.5 w-3.5")}
                        </span>
                        {item.label}
                      </Link>
                    ))}

                  <button
                    type="button"
                    onClick={() => setMobileMenu("expanded")}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="2" width="14" height="12" rx="2" />
                        <path d="M1 6h14" />
                      </svg>
                    </span>
                    Menü
                    <ChevronDown />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenu("expanded")}
                  className="mt-2 flex w-full items-center gap-3 rounded-lg border-t border-[var(--color-border-default)] px-2 pt-3 text-left transition-colors hover:bg-[var(--color-surface-subtle)]"
                >
                  {showIdentityLoader ? (
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
                  ) : (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border-soft)] text-[14px] font-medium text-white"
                      style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                    >
                      {initial}
                    </div>
                  )}
                  {showIdentityLoader ? (
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-24 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
                      <div className="h-2 w-14 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{displayName ?? "Profil"}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">{roleLabel}</p>
                    </div>
                  )}
                  <svg className="h-4 w-4 text-[var(--color-text-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 2l4 4-4 4" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="mx-4 mt-2 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] shadow-lg shadow-black/[0.04]">
                <div className="flex items-center gap-3 border-b border-[var(--color-border-default)] px-4 py-3">
                  <Link
                    href={homeDestination}
                    onClick={() => setMobileMenu("closed")}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-[13px] font-medium text-white"
                  >
                    <GridIcon className="h-3.5 w-3.5" />
                    {homeLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenu("quickview")}
                    className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]"
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border-soft)] text-[15px] font-medium text-white"
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

                {navItems
                  .filter((item) => item.id !== "home")
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className={index === 0 ? "mt-3" : "mt-2 border-t border-[var(--color-border-default)] pt-2"}
                    >
                      <p className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
                        {item.label}
                      </p>
                      {item.items?.map((child) => (
                        <MobileMenuItem
                          key={child.id}
                          href={child.href}
                          icon={getItemIcon(item.id, "h-4 w-4")}
                          title={child.label}
                          desc={child.description}
                          onClick={() => setMobileMenu("closed")}
                        />
                      ))}
                    </div>
                  ))}

                {showProfileMenuItem || showLanguageMenuItem ? (
                  <div className="mt-4 border-t border-[var(--color-border-soft)] px-4 pb-1 pt-4">
                    <p className="pb-2 text-[10px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
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

                    {showLanguageMenuItem ? (
                      <div className="rounded-lg px-3 py-3">
                        <p className="pb-2 text-[11px] font-medium uppercase tracking-[1.3px] text-[var(--color-text-muted)]">
                          Nyelv
                        </p>
                        <LanguageSwitcher variant="pills" />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {showSignOutMenuItem ? (
                  <div className="border-t border-[var(--color-border-soft)] px-4 pb-4 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        signOut({ redirectUrl: "/" });
                        setMobileMenu("closed");
                      }}
                      className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" />
                      </svg>
                      Kijelentkezés
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function MobileMenuItem({
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
      className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-surface-subtle)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-border-default)] group-hover:text-[var(--color-text-secondary)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="truncate text-[12px] text-[var(--color-text-muted)]">{desc}</p>
      </div>
      <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-border-soft)] transition-colors group-hover:text-[var(--color-text-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 2l4 4-4 4" />
      </svg>
    </Link>
  );
}
