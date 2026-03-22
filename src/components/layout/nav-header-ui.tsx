"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

const DEFAULT_AVATAR = "/avatars/avatar-1.png";

interface NavHeaderUIProps {
  user: { username: string | null; email: string | null };
  org: { id: string; name: string } | null;
  teams: Array<{ id: string; name: string }>;
  role: string;
  activeCampaignCount: number;
  isAdmin: boolean;
  isManager: boolean;
  hasHiringAccess: boolean;
}

function getInitials(name: string): string {
  const first = name.split(/[\s@.]/)[0] ?? "";
  return first.slice(0, 2).toUpperCase() || "?";
}

export function NavHeaderUI({
  user,
  org,
  teams,
  activeCampaignCount,
  isAdmin,
  isManager,
  hasHiringAccess,
}: NavHeaderUIProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const [teamOpen, setTeamOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string>(DEFAULT_AVATAR);

  useEffect(() => {
    const stored = window.localStorage.getItem("trita_avatar");
    if (stored) setAvatarSrc(stored);
  }, []);

  // Use first accessible team for display; all for dropdown
  const team = teams[0] ?? null;
  const dashboardHref = isManager || isAdmin ? "/dashboard" : "/profile/results";
  const onDashboard = pathname === "/dashboard" || pathname === "/profile/results";
  const onTeam = teams.some((t) => pathname.startsWith(`/team/${t.id}`));
  const onOrg = org ? pathname.startsWith(`/org/${org.id}`) : false;
  const onHiring = org ? pathname.startsWith(`/hiring/${org.id}`) : false;

  const displayName = user.username ?? user.email ?? "?";
  const userInitials = getInitials(displayName);

  const closeAll = () => {
    setTeamOpen(false);
    setOrgOpen(false);
    setAvatarOpen(false);
  };

  // Close all dropdowns and mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setTeamOpen(false);
    setOrgOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  const pillBase =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer select-none";
  const pillActive = `${pillBase} bg-[#1a1814] text-white`;
  const pillInactive = `${pillBase} text-[#3d3a35] hover:bg-[#f0ede8]`;

  const anyOpen = teamOpen || orgOpen || avatarOpen;

  return (
    <>
      {anyOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={closeAll}
        />
      )}
      <header className="sticky top-0 z-40 h-[52px] w-full border-b border-[#e8e4dc] bg-[#faf9f6] lg:h-[64px]">
        <div className="mx-auto flex h-full w-full max-w-5xl items-center gap-3 px-4">
          {/* Logo */}
          <Link
            href={dashboardHref}
            className="font-playfair mr-2 inline-flex flex-shrink-0 items-baseline text-[18px] font-black tracking-tight text-[#1a1814] lg:text-[22px]"
          >
            trit<span className="text-[#c8410a]">a</span>
          </Link>

          {/* Desktop center nav */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            <Link href={dashboardHref} className={onDashboard ? pillActive : pillInactive}>
              Vezérlő
            </Link>

            {team && (
              <div className="relative">
                <button
                  type="button"
                  className={onTeam ? pillActive : pillInactive}
                  onClick={() => {
                    setTeamOpen((p) => !p);
                    setOrgOpen(false);
                    setAvatarOpen(false);
                  }}
                >
                  {teams.length === 1 ? team.name : "Csapatok"}
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M2 4l4 4 4-4" />
                  </svg>
                </button>
                {teamOpen && (
                  <div className="absolute left-0 top-[calc(100%+6px)] w-52 rounded-xl border border-[#e8e4dc] bg-white p-1.5 shadow-lg">
                    {teams.length === 1 ? (
                      <>
                        <DropItem
                          href={`/team/${team.id}`}
                          label="Áttekintés"
                          active={pathname === `/team/${team.id}`}
                        />
                        <DropItem href={`/team/${team.id}?tab=profile`} label="Személyiségprofil" />
                        <DropItem href={`/team/${team.id}?tab=members`} label="Tagok" />
                      </>
                    ) : (
                      teams.map((t) => (
                        <DropItem
                          key={t.id}
                          href={`/team/${t.id}`}
                          label={t.name}
                          active={pathname.startsWith(`/team/${t.id}`)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {org && isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  className={onOrg ? pillActive : pillInactive}
                  onClick={() => {
                    setOrgOpen((p) => !p);
                    setTeamOpen(false);
                    setAvatarOpen(false);
                  }}
                >
                  {org.name}
                  {activeCampaignCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-[#c8410a] px-1.5 py-[1px] font-mono text-[9px] text-white">
                      {activeCampaignCount}
                    </span>
                  )}
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M2 4l4 4 4-4" />
                  </svg>
                </button>
                {orgOpen && (
                  <div className="absolute left-0 top-[calc(100%+6px)] w-52 rounded-xl border border-[#e8e4dc] bg-white p-1.5 shadow-lg">
                    <DropItem
                      href={`/org/${org.id}`}
                      label="Áttekintés"
                      active={onOrg && !pathname.includes("?")}
                    />
                    <DropItem
                      href={`/org/${org.id}?tab=campaigns`}
                      label="Kampányok"
                      badge={activeCampaignCount > 0 ? activeCampaignCount : undefined}
                    />
                    <DropItem href={`/org/${org.id}?tab=teams`} label="Csapatok" />
                    <DropItem href={`/org/${org.id}?tab=members`} label="Tagok" />
                  </div>
                )}
              </div>
            )}

            {org && isManager && hasHiringAccess && (
              <Link href={`/hiring/${org.id}`} className={onHiring ? pillActive : pillInactive}>
                Felvétel
              </Link>
            )}
          </nav>

          {/* Desktop right: avatar pill */}
          <div className="ml-auto hidden lg:block">
            <div className="relative">
              <button
                type="button"
                className="flex min-h-[32px] cursor-pointer items-center gap-2 rounded-full border border-[#e8e4dc] bg-white px-2.5 py-1 text-[13px] font-medium text-[#3d3a35] transition hover:bg-[#f0ede8]"
                onClick={() => {
                  setAvatarOpen((p) => !p);
                  setTeamOpen(false);
                  setOrgOpen(false);
                }}
              >
                <Image
                  src={avatarSrc}
                  alt="Avatar"
                  width={40}
                  height={40}
                  unoptimized
                  className="h-8 w-8 flex-shrink-0 rounded-full object-cover lg:h-10 lg:w-10"
                />
                <span className="max-w-[120px] truncate">{displayName}</span>
                <svg
                  className="h-3 w-3 text-[#a09a90]"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-48 rounded-xl border border-[#e8e4dc] bg-white p-1.5 shadow-lg">
                  <DropItem href="/profile" label="Profil" />
                  <DropItem href="/billing" label="Számlázás" />
                  <div className="my-1 border-t border-[#e8e4dc]" />
                  <button
                    type="button"
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Kilépés
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: avatar chip + hamburger */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <Image
              src={avatarSrc}
              alt="Avatar"
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#e8e4dc] bg-white text-[#3d3a35] transition hover:bg-[#f0ede8]"
            >
              {mobileOpen ? (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="h-5 w-5"
                >
                  <path d="M4 4l12 12M16 4L4 16" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="h-5 w-5"
                >
                  <path d="M3 5h14M3 10h14M3 15h14" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <div
            className="absolute right-0 top-0 flex h-full w-[280px] flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-[#e8e4dc] px-5 py-4">
              <Link
                href={dashboardHref}
                className="font-playfair text-[18px] font-black tracking-tight text-[#1a1814]"
                onClick={() => setMobileOpen(false)}
              >
                trit<span className="text-[#c8410a]">a</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e4dc] text-[#3d3a35]"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="h-4 w-4"
                >
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <MobileNavSection>
                <MobileNavItem
                  href={dashboardHref}
                  label="Vezérlő"
                  active={onDashboard}
                  onClose={() => setMobileOpen(false)}
                />
              </MobileNavSection>

              {teams.length > 0 && (
                teams.length === 1 ? (
                  <MobileNavSection label={team!.name}>
                    <MobileNavItem
                      href={`/team/${team!.id}`}
                      label="Áttekintés"
                      active={pathname === `/team/${team!.id}`}
                      onClose={() => setMobileOpen(false)}
                    />
                    <MobileNavItem
                      href={`/team/${team!.id}?tab=profile`}
                      label="Személyiségprofil"
                      onClose={() => setMobileOpen(false)}
                    />
                    <MobileNavItem
                      href={`/team/${team!.id}?tab=members`}
                      label="Tagok"
                      onClose={() => setMobileOpen(false)}
                    />
                  </MobileNavSection>
                ) : (
                  <MobileNavSection label="Csapatok">
                    {teams.map((t) => (
                      <MobileNavItem
                        key={t.id}
                        href={`/team/${t.id}`}
                        label={t.name}
                        active={pathname.startsWith(`/team/${t.id}`)}
                        onClose={() => setMobileOpen(false)}
                      />
                    ))}
                  </MobileNavSection>
                )
              )}

              {org && isAdmin && (
                <MobileNavSection label={org.name}>
                  <MobileNavItem
                    href={`/org/${org.id}`}
                    label="Áttekintés"
                    active={onOrg && !pathname.includes("?")}
                    onClose={() => setMobileOpen(false)}
                  />
                  <MobileNavItem
                    href={`/org/${org.id}?tab=campaigns`}
                    label="Kampányok"
                    badge={activeCampaignCount > 0 ? activeCampaignCount : undefined}
                    onClose={() => setMobileOpen(false)}
                  />
                  <MobileNavItem
                    href={`/org/${org.id}?tab=teams`}
                    label="Csapatok"
                    onClose={() => setMobileOpen(false)}
                  />
                  <MobileNavItem
                    href={`/org/${org.id}?tab=members`}
                    label="Tagok"
                    onClose={() => setMobileOpen(false)}
                  />
                </MobileNavSection>
              )}

              {org && isManager && hasHiringAccess && (
                <MobileNavSection label="Felvétel">
                  <MobileNavItem
                    href={`/hiring/${org.id}`}
                    label="Jelöltek"
                    active={onHiring}
                    onClose={() => setMobileOpen(false)}
                  />
                </MobileNavSection>
              )}

              <MobileNavSection label="Fiók">
                <MobileNavItem
                  href="/profile"
                  label="Profil"
                  onClose={() => setMobileOpen(false)}
                />
                <MobileNavItem
                  href="/billing"
                  label="Számlázás"
                  onClose={() => setMobileOpen(false)}
                />
              </MobileNavSection>
            </nav>

            {/* Drawer footer */}
            <div className="border-t border-[#e8e4dc] p-4">
              <div className="mb-3 flex items-center gap-2.5 px-1">
                <Image
                  src={avatarSrc}
                  alt="Avatar"
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                />
                <p className="min-w-0 truncate text-[13px] font-medium text-[#1a1814]">
                  {displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/" })}
                className="w-full rounded-lg border border-rose-200 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Kilépés
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DropItem({
  href,
  label,
  active,
  badge,
}: {
  href: string;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "bg-[#f5ede8] text-[#c8410a]"
          : "text-[#3d3a35] hover:bg-[#f5ede8] hover:text-[#1a1814]"
      }`}
    >
      {label}
      {badge != null && (
        <span className="rounded-full bg-[#c8410a] px-1.5 py-[1px] font-mono text-[9px] text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileNavSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      {label && (
        <p className="mb-1 px-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#a09a90]">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function MobileNavItem({
  href,
  label,
  active,
  badge,
  onClose,
}: {
  href: string;
  label: string;
  active?: boolean;
  badge?: number;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
        active ? "bg-[#1a1814] text-white" : "text-[#3d3a35] hover:bg-[#f0ede8]"
      }`}
    >
      {label}
      {badge != null && (
        <span className="rounded-full bg-[#c8410a] px-1.5 py-[1px] font-mono text-[9px] text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
