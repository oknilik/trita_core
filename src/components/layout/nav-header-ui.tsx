"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";

// ── Icons (14×14, stroke currentColor) ──────────────────────────────────────

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

function SelfIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.8" />
      <path d="M2.5 13.5a5.5 5.5 0 0 1 11 0" />
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

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-[var(--color-text-secondary)]">
      <path d="M8 2a5 5 0 0 1 5 5v2l1.5 2H1.5L3 9V7a5 5 0 0 1 5-5z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
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

// ── Mega-dropdown item ──────────────────────────────────────────────────────

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

// ── Props ───────────────────────────────────────────────────────────────────

interface NavHeaderUIProps {
  user: { username: string | null; email: string | null };
  org: { id: string; name: string } | null;
  teams: Array<{ id: string; name: string }>;
  homeHref: string;
  role: string;
  activeCampaignCount: number;
  isAdmin: boolean;
  isManager: boolean;
  hasHiringAccess: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

export function NavHeaderUI({
  user,
  org,
  teams,
  homeHref,
  activeCampaignCount,
  isAdmin,
  isManager,
  hasHiringAccess,
}: NavHeaderUIProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  type DropdownKey = "teams" | "candidates" | "org" | null;
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  type MobileMenuState = "closed" | "quickview" | "expanded";
  const [mobileMenu, setMobileMenu] = useState<MobileMenuState>("closed");
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(
    user.username ?? null,
  );
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(
    user.email ?? null,
  );
  const [identityReady, setIdentityReady] = useState<boolean>(
    () => Boolean(user.username || user.email),
  );

  const team = teams[0] ?? null;
  const homePath = homeHref.split("?")[0] ?? homeHref;
  const homeLabel = "Kezdőlap";
  const onSelfResults = pathname.startsWith("/profile/results");
  const onHome =
    homePath === "/dashboard" || homePath === "/platform/home"
      ? pathname === "/dashboard" || pathname === "/platform/home"
      : pathname.startsWith(homePath);
  const onTeam = teams.some((t) => pathname.startsWith(`/team/${t.id}`));
  const onOrg = org ? pathname.startsWith(`/org/${org.id}`) : false;
  const onHiring = org ? pathname.startsWith(`/hiring/${org.id}`) : false;

  const refreshIdentity = useCallback(async () => {
    setIdentityReady(false);
    try {
      const res = await fetch("/api/profile/onboarding");
      if (!res.ok) return;
      const data = await res.json();
      setResolvedUsername(data?.username ?? null);
      setResolvedEmail(data?.email ?? user.email ?? null);
    } catch {
      // noop: keep existing identity
    } finally {
      setIdentityReady(true);
    }
  }, [user.email]);

  const displayName = resolvedUsername || resolvedEmail || null;
  const showIdentityLoader = !identityReady;
  const initial = getAvatarMonogram(displayName, { length: 1, fallback: "P" });
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName ?? "trita");
  const roleLabel = isAdmin ? "Admin" : "Manager";

  const closeAll = useCallback(() => setOpenDropdown(null), []);

  const toggle = useCallback((key: DropdownKey) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  // Close on route change
  useEffect(() => {
    setMobileMenu("closed");
    setOpenDropdown(null);
  }, [pathname]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeAll(); };
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

  // ── Nav item styles ───────────────────────────────────────────────────────

  const navItemBase = "inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all cursor-pointer select-none rounded-lg";
  const navItemActive = `${navItemBase} bg-[var(--color-surface-subtle)] text-[var(--color-accent-primary)] font-semibold`;
  const navItemInactive = `${navItemBase} text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-canvas)]`;

  // ── Mega-dropdown wrapper ─────────────────────────────────────────────────

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

  return (
    <>
      {/* Backdrop for closing dropdowns */}
      {openDropdown && (
        <div className="fixed inset-0 z-30" onClick={closeAll} />
      )}

      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[rgba(250,249,246,0.95)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-8">

          {/* Logo */}
          <Link
            href={homeHref}
            aria-label="trita"
            className="font-fraunces mr-3 text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]"
          >
            <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
          </Link>

          {/* ── Desktop nav ──────────────────────────────────────────────── */}
          <nav className="hidden items-center gap-1 lg:flex">

            {/* Vezérlő */}
            <Link
              href={homeHref}
              className={`${onHome ? "rounded-lg bg-[var(--color-text-primary)] text-white px-4 py-1.5 text-[13px] font-medium inline-flex items-center gap-2" : navItemInactive}`}
            >
              <GridIcon className="h-3.5 w-3.5" />
              {homeLabel}
            </Link>

            <Link
              href="/profile/results"
              className={onSelfResults ? navItemActive : navItemInactive}
            >
              <SelfIcon />
              Saját profil
            </Link>

            {/* Csapatok dropdown */}
            {team && (
              <div className="relative">
                <button
                  type="button"
                  className={onTeam || openDropdown === "teams" ? navItemActive : navItemInactive}
                  onClick={() => toggle("teams")}
                >
                  <TeamIcon />
                  {teams.length === 1 ? team.name : "Csapatok"}
                  <ChevronDown />
                </button>
                <MegaDropdown isOpen={openDropdown === "teams"}>
                  {teams.length === 1 ? (
                    <>
                      <MegaItem href={`/team/${team.id}`} icon={<TeamIcon />} title="Csapat áttekintése" desc="Eredmények és aktivitás" onClick={closeAll} />
                      <MegaItem href={`/team/${team.id}?tab=members`} icon={<TeamIcon />} title="Tagok és szerepkörök" desc="Meglévő tagok kezelése" onClick={closeAll} />
                      <MegaItem href={`/team/${team.id}?tab=profile`} icon={<OrgIcon />} title="Személyiségprofil" desc="Személyiségprofil áttekintése" onClick={closeAll} />
                    </>
                  ) : (
                    <>
                      {teams.map((tm) => (
                        <MegaItem key={tm.id} href={`/team/${tm.id}`} icon={<TeamIcon />} title={tm.name} desc="Csapat áttekintése" onClick={closeAll} />
                      ))}
                    </>
                  )}
                </MegaDropdown>
              </div>
            )}

            {/* Jelöltek dropdown */}
            {org && hasHiringAccess && (
              <div className="relative">
                <button
                  type="button"
                  className={onHiring || openDropdown === "candidates" ? navItemActive : navItemInactive}
                  onClick={() => toggle("candidates")}
                >
                  <CandidateIcon />
                  Jelöltek
                  <ChevronDown />
                </button>
                <MegaDropdown isOpen={openDropdown === "candidates"}>
                  <MegaItem href={`/hiring/${org.id}`} icon={<CandidateIcon />} title="Jelöltfolyamat" desc="Aktív és archív jelöltek" onClick={closeAll} />
                  <MegaItem href={`/hiring/${org.id}?invite=true`} icon={<CandidateIcon />} title="Új jelölt hozzáadása" desc="Értékelés indítása" onClick={closeAll} />
                  <MegaItem href="/billing" icon={<OrgIcon />} title="Csomagok és kreditek" desc="Candidate add-on kezelése" onClick={closeAll} />
                </MegaDropdown>
              </div>
            )}

            {/* Separator */}
            {org && isAdmin && <div className="mx-2 h-5 w-px bg-[var(--color-border-soft)]" />}

            {/* Szervezet dropdown (admin only) */}
            {org && isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  className={onOrg || openDropdown === "org" ? navItemActive : navItemInactive}
                  onClick={() => toggle("org")}
                >
                  <OrgIcon />
                  {org.name}
                  {activeCampaignCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-[var(--color-text-primary)] px-1.5 py-[1px] font-mono text-[9px] text-white">
                      {activeCampaignCount}
                    </span>
                  )}
                  <ChevronDown />
                </button>
                <MegaDropdown isOpen={openDropdown === "org"}>
                  <MegaItem href={`/org/${org.id}`} icon={<OrgIcon />} title="Szervezeti áttekintés" desc="Csapatok és tagok összesítése" onClick={closeAll} />
                  <MegaItem href={`/org/${org.id}?tab=members`} icon={<TeamIcon />} title="Szerepkörök kezelése" desc="Admin, manager, member" onClick={closeAll} />
                  <MegaItem href="/billing" icon={<OrgIcon />} title="Beállítások" desc="Számlázás, csomagok" onClick={closeAll} />
                </MegaDropdown>
              </div>
            )}
          </nav>

          {/* ── Desktop right side ───────────────────────────────────────── */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Bell */}
            <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-opacity hover:opacity-70">
              <BellIcon />
            </button>

            {/* Separator + Language */}
            <div className="h-5 w-px bg-[var(--color-border-default)]" />
            <LanguageSwitcher />

            {/* Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-white pl-1 pr-2.5 py-0.5 transition hover:border-[var(--color-text-muted)]"
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
                <span className="max-w-[90px] truncate text-[12px] font-medium text-[var(--color-text-secondary)]">{displayName ?? "Profil"}</span>
              )}
            </Link>
          </div>

          {/* ── Mobile: language + bell + hamburger ─────────────────────── */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-opacity hover:opacity-70">
              <BellIcon />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenu((s) => s === "closed" ? "quickview" : "closed")}
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

      {/* ── Mobile panel ────────────────────────────────────────────────── */}
      {mobileMenu !== "closed" && (
        <>
          {/* Overlay */}
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
              /* ── Quickview panel ──────────────────────────────────────── */
              <div className="mx-4 mt-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] p-4 shadow-lg shadow-black/[0.04]">
                {/* Vezérlő pill */}
                <Link
                  href={homeHref}
                  onClick={() => setMobileMenu("closed")}
                  className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-[13px] font-medium text-white"
                >
                  <GridIcon className="h-3.5 w-3.5" />
                  {homeLabel}
                </Link>

                {/* Menu items */}
                <div className="flex flex-col gap-0.5">
                  <Link
                    href="/profile/results"
                    onClick={() => setMobileMenu("closed")}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                      <SelfIcon className="h-3.5 w-3.5" />
                    </span>
                    Saját profil
                  </Link>

                  {teams.map((tm) => (
                    <Link
                      key={tm.id}
                      href={`/team/${tm.id}`}
                      onClick={() => setMobileMenu("closed")}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                        <TeamIcon className="h-3.5 w-3.5" />
                      </span>
                      {teams.length === 1 ? "Csapatom" : tm.name}
                    </Link>
                  ))}

                  {org && hasHiringAccess && (
                    <Link
                      href={`/hiring/${org.id}`}
                      onClick={() => setMobileMenu("closed")}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                        <CandidateIcon className="h-3.5 w-3.5" />
                      </span>
                      Jelöltek
                    </Link>
                  )}

                  {org && isAdmin && (
                    <Link
                      href={`/org/${org.id}`}
                      onClick={() => setMobileMenu("closed")}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]">
                        <OrgIcon className="h-3.5 w-3.5" />
                      </span>
                      {org.name}
                    </Link>
                  )}

                  {/* Expand to full menu */}
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
                    Menu
                    <ChevronDown />
                  </button>
                </div>

                {/* Profile row */}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenu("closed")}
                  className="mt-2 flex items-center gap-3 rounded-lg border-t border-[var(--color-border-default)] px-2 pt-3 transition-colors hover:bg-[var(--color-surface-subtle)]"
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
                </Link>
              </div>
            ) : (
              /* ── Expanded panel ──────────────────────────────────────── */
              <div className="mx-4 mt-2 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] shadow-lg shadow-black/[0.04]">
                {/* Header: pill + collapse */}
                <div className="flex items-center gap-3 border-b border-[var(--color-border-default)] px-4 py-3">
                  <Link
                    href={homeHref}
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

                {/* Profile card */}
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

                {/* ── Csapatok section ── */}
                <div className="mt-3">
                  <p className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
                    Saját nézet
                  </p>
                  <MobileMenuItem
                    href="/profile/results"
                    icon={<SelfIcon className="h-4 w-4" />}
                    title="Saját profil"
                    desc="Személyes eredmények és insightok"
                    onClick={() => setMobileMenu("closed")}
                  />

                  <p className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
                    {isAdmin ? "Csapatok" : "Csapatom"}
                  </p>
                  {teams.length === 1 && team ? (
                    <>
                      <MobileMenuItem href={`/team/${team.id}`} icon={<TeamIcon className="h-4 w-4" />} title="Csapat áttekintése" desc="Eredmények és aktivitás" onClick={() => setMobileMenu("closed")} />
                      <MobileMenuItem href={`/team/${team.id}?tab=members`} icon={<TeamIcon className="h-4 w-4" />} title="Tagok és szerepkörök" desc="Meglévő tagok kezelése" onClick={() => setMobileMenu("closed")} />
                      <MobileMenuItem href={`/team/${team.id}?tab=profile`} icon={<OrgIcon className="h-4 w-4" />} title="Személyiségprofil" desc="Személyiségprofil áttekintése" onClick={() => setMobileMenu("closed")} />
                    </>
                  ) : (
                    teams.map((tm) => (
                      <MobileMenuItem key={tm.id} href={`/team/${tm.id}`} icon={<TeamIcon className="h-4 w-4" />} title={tm.name} desc="Csapat áttekintése" onClick={() => setMobileMenu("closed")} />
                    ))
                  )}
                </div>

                {/* ── Jelöltek section ── */}
                {org && hasHiringAccess && (
                  <div className="mt-2 border-t border-[var(--color-border-default)] pt-2">
                    <p className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
                      Jelöltek
                    </p>
                    <MobileMenuItem href={`/hiring/${org.id}`} icon={<CandidateIcon className="h-4 w-4" />} title="Jelöltfolyamat" desc="Aktív és archív jelöltek" onClick={() => setMobileMenu("closed")} />
                    <MobileMenuItem href={`/hiring/${org.id}?invite=true`} icon={<CandidateIcon className="h-4 w-4" />} title="Új jelölt hozzáadása" desc="Értékelés indítása" onClick={() => setMobileMenu("closed")} />
                    <MobileMenuItem href="/billing" icon={<OrgIcon className="h-4 w-4" />} title="Csomagok és kreditek" desc="Candidate add-on kezelése" onClick={() => setMobileMenu("closed")} />
                  </div>
                )}

                {/* ── Szervezet section (admin only) ── */}
                {org && isAdmin && (
                  <div className="mt-2 border-t border-[var(--color-border-default)] pt-2">
                    <p className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
                      {org.name}
                    </p>
                    <MobileMenuItem href={`/org/${org.id}`} icon={<OrgIcon className="h-4 w-4" />} title="Szervezeti áttekintés" desc="Csapatok és tagok összesítése" onClick={() => setMobileMenu("closed")} />
                    <MobileMenuItem href={`/org/${org.id}?tab=members`} icon={<TeamIcon className="h-4 w-4" />} title="Szerepkörök kezelése" desc="Admin, manager, member" onClick={() => setMobileMenu("closed")} />
                    <MobileMenuItem href="/billing" icon={<OrgIcon className="h-4 w-4" />} title="Beállítások" desc="Számlázás, csomagok" onClick={() => setMobileMenu("closed")} />
                  </div>
                )}

                {/* ── Footer ── */}
                <div className="mt-4 border-t border-[var(--color-border-soft)] px-4 pb-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { signOut({ redirectUrl: "/" }); setMobileMenu("closed"); }}
                    className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" />
                    </svg>
                    Kijelentkezés
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

// ── Mobile menu item ────────────────────────────────────────────────────────

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
