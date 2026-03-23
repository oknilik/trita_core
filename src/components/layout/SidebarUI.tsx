"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

const DEFAULT_AVATAR = "/avatars/avatar-1.png";

interface SidebarUIProps {
  user: { username: string | null; email: string | null };
  org: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  role: string;
  activeCampaignCount: number;
  isManager: boolean;
}

function getInitials(name: string): string {
  const first = name.split(/[\s@.]/)[0] ?? "";
  return first.slice(0, 2).toUpperCase() || "?";
}

export function SidebarUI({
  user,
  org,
  team,
  role,
  activeCampaignCount,
  isManager,
}: SidebarUIProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signOut } = useClerk();
  const [avatarSrc] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("trita_avatar") ?? DEFAULT_AVATAR;
    }
    return DEFAULT_AVATAR;
  });

  const tab = searchParams.get("tab");

  const isDashboard = pathname === "/profile/results";

  const isTeamTab = (t?: string) => {
    if (!team || pathname !== `/team/${team.id}`) return false;
    if (!t) return !tab || tab === "overview";
    return tab === t;
  };

  const isOrgTab = (t?: string) => {
    if (!org || pathname !== `/org/${org.id}`) return false;
    if (!t) return !tab || tab === "overview";
    return tab === t;
  };

  const displayName = user.username ?? user.email ?? "?";
  const userInitials = getInitials(displayName);

  const roleLabel =
    role === "ORG_ADMIN"
      ? "Admin"
      : role === "ORG_MANAGER"
      ? "Menedzser"
      : "Tag";

  const NavItem = ({
    href,
    icon,
    label,
    active,
    badge,
    indent = false,
  }: {
    href: string;
    icon: string;
    label: string;
    active: boolean;
    badge?: number;
    indent?: boolean;
  }) => (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-[7px] transition-colors ${
        indent ? "pl-7 text-[11px]" : "text-[12px]"
      } font-medium ${
        active
          ? "bg-[#2a2824] text-white"
          : "text-muted-warm hover:bg-[#2a2824] hover:text-sand"
      }`}
    >
      <span
        className={`flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-[4px] text-[9px] font-semibold ${
          active ? "bg-sage text-white" : "bg-[#3a3834] text-muted-warm"
        }`}
      >
        {icon}
      </span>
      {label}
      {badge != null && badge > 0 && (
        <span className="ml-auto rounded-full bg-sage px-[5px] py-[1px] font-mono text-[8px] text-white">
          {badge}
        </span>
      )}
    </Link>
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="mb-1 mt-3 px-3 font-mono text-[8px] uppercase tracking-[.14em] text-ink-warm">
      {label}
    </p>
  );

  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col bg-ink">
      {/* Logo */}
      <div className="border-b border-[#2a2824] px-5 py-[18px]">
        <Link
          href="/profile/results"
          className="font-fraunces inline-block text-[18px] font-black tracking-tight text-white"
        >
          trit<span className="text-bronze">a</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SectionLabel label="Áttekintés" />
        <NavItem href="/profile/results" icon="⌂" label="Vezérlő" active={isDashboard} />

        {team && (
          <>
            <SectionLabel label="Csapatom" />
            <NavItem
              href={`/team/${team.id}`}
              icon="T"
              label={team.name}
              active={isTeamTab() && !tab}
            />
            <NavItem
              href={`/team/${team.id}`}
              icon="A"
              label="Áttekintés"
              active={isTeamTab()}
              indent
            />
            <NavItem
              href={`/team/${team.id}?tab=profile`}
              icon="P"
              label="Személyiségprofil"
              active={isTeamTab("profile")}
              indent
            />
            <NavItem
              href={`/team/${team.id}?tab=members`}
              icon="T"
              label="Tagok"
              active={isTeamTab("members")}
              indent
            />
          </>
        )}

        {org && isManager && (
          <>
            <SectionLabel label="Szervezet" />
            <NavItem
              href={`/org/${org.id}`}
              icon="O"
              label={org.name}
              active={isOrgTab() && !tab}
            />
            <NavItem
              href={`/org/${org.id}?tab=campaigns`}
              icon="K"
              label="Kampányok"
              active={isOrgTab("campaigns")}
              badge={activeCampaignCount}
              indent
            />
            <NavItem
              href={`/org/${org.id}?tab=teams`}
              icon="C"
              label="Csapatok"
              active={isOrgTab("teams")}
              indent
            />
            <NavItem
              href={`/org/${org.id}?tab=members`}
              icon="T"
              label="Tagok"
              active={isOrgTab("members")}
              indent
            />
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#2a2824] p-3">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-[#2a2824]"
        >
          <Image
            src={avatarSrc}
            alt="Avatar"
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-sand">{displayName}</p>
            <p className="text-[10px] text-ink-warm">{roleLabel}</p>
          </div>
        </button>
        <div className="mt-2 flex items-center gap-3 px-2">
          <Link
            href="/privacy"
            className="text-[10px] text-ink-warm transition-colors hover:text-muted-warm"
          >
            Adatvédelem
          </Link>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="ml-auto text-[10px] text-ink-warm transition-colors hover:text-bronze"
          >
            Kilépés
          </button>
        </div>
      </div>
    </aside>
  );
}
