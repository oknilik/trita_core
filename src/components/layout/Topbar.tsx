"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

interface TopbarProps {
  orgId?: string;
  orgName?: string;
  teamId?: string;
  teamName?: string;
}

interface Crumb {
  label: string;
  href?: string;
}

export function Topbar({ orgId, orgName, teamId, teamName }: TopbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/dashboard" }];

  if (teamId && pathname.startsWith(`/team/${teamId}`)) {
    crumbs.push({ label: teamName ?? "Csapat", href: `/team/${teamId}` });
    if (tab === "profile") crumbs.push({ label: "Személyiségprofil" });
    else if (tab === "members") crumbs.push({ label: "Tagok" });
  } else if (orgId && pathname.startsWith(`/org/${orgId}`)) {
    crumbs.push({ label: orgName ?? "Szervezet", href: `/org/${orgId}` });
    if (tab === "campaigns") crumbs.push({ label: "Kampányok" });
    else if (tab === "teams") crumbs.push({ label: "Csapatok" });
    else if (tab === "members") crumbs.push({ label: "Tagok" });
    else if (pathname.includes("/campaigns/")) crumbs.push({ label: "Kampány" });
    else if (pathname.includes("/settings")) crumbs.push({ label: "Beállítások" });
  } else if (pathname === "/profile" || pathname.startsWith("/profile")) {
    crumbs.push({ label: "Profil" });
  } else if (pathname.startsWith("/billing")) {
    crumbs.push({ label: "Számlázás" });
  } else if (pathname.startsWith("/admin")) {
    crumbs.push({ label: "Admin" });
  }

  return (
    <header className="flex h-[46px] flex-shrink-0 items-center border-b border-sand bg-cream px-5">
      <nav className="flex items-center gap-1.5">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-[11px] text-[#d3cfc6]">›</span>
              )}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="text-[12px] font-medium text-ink-body transition-colors hover:text-bronze"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[12px] font-semibold text-ink">
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </header>
  );
}
