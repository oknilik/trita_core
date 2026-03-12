import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { OrgCreateForm } from "@/components/org/OrgCreateForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezetek | Trita", robots: { index: false } };
}

export default async function OrgListPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  // 1-org rule: user belongs to at most one org
  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: {
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { members: true, teams: true } },
        },
      },
    },
  });
  const memberships = membership ? [membership] : [];

  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Hero */}
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// kkv & csapat" : "// sme & team"}
          </p>
          <h1 className="font-playfair text-3xl text-[#1a1814] mt-1 md:text-4xl">
            {isHu ? "Szervezetek" : "Organizations"}
          </h1>
          <p className="mt-2 text-sm text-[#3d3a35]/70">
            {memberships.length > 0
              ? isHu
                ? "Csapatprofil, heatmap, tagkezelés"
                : "Team profiles, heatmap, member management"
              : isHu
                ? "Hozz létre szervezetet és hívd meg csapatodat"
                : "Create an organization and invite your team"}
          </p>
        </div>

        {/* Create new org — only if not yet in one */}
        {memberships.length === 0 && (
          <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
              {isHu ? "// új szervezet" : "// new organization"}
            </p>
            <h2 className="font-playfair text-xl text-[#1a1814] mb-1">
              {isHu ? "Új szervezet" : "New organization"}
            </h2>
            <p className="mb-5 text-sm text-[#3d3a35]/70">
              {isHu
                ? "Adj nevet a szervezetnek, majd hívd meg a csapattagokat."
                : "Give your organization a name, then invite team members."}
            </p>
            <OrgCreateForm locale={locale} />
          </section>
        )}

        {/* Org list */}
        {memberships.length > 0 && (
          <section className="flex flex-col gap-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
                {isHu ? "// szervezeteim" : "// my organizations"}
              </p>
              <h2 className="font-playfair text-xl text-[#1a1814] mt-0.5">
                {isHu ? "Szervezeteim" : "My organizations"}{" "}
                <span className="font-sans text-sm font-normal text-[#3d3a35]/50">({memberships.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {memberships.map(({ org, role }) => (
                <Link
                  key={org.id}
                  href={`/org/${org.id}`}
                  className="group rounded-2xl border border-[#e8e4dc] bg-white p-5 shadow-sm transition-all hover:border-[#c8410a]/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold text-[#1a1814] transition-colors group-hover:text-[#c8410a]">
                      {org.name}
                    </p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      role === "ORG_ADMIN"
                        ? "bg-[#c8410a]/10 text-[#c8410a]"
                        : role === "ORG_MANAGER"
                        ? "bg-[#1a1814]/10 text-[#1a1814]"
                        : "bg-[#e8e4dc] text-[#3d3a35]"
                    }`}>
                      {role === "ORG_ADMIN"
                        ? "Admin"
                        : role === "ORG_MANAGER"
                        ? isHu ? "Menedzser" : "Manager"
                        : isHu ? "Tag" : "Member"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-[#3d3a35]/60">
                      {org._count.members} {isHu ? "tag" : org._count.members === 1 ? "member" : "members"}
                      {" · "}
                      {org._count.teams} {isHu ? "csapat" : org._count.teams === 1 ? "team" : "teams"}
                      {" · "}
                      {org.createdAt.toLocaleDateString(dateLocale)}
                    </p>
                    <span className="font-mono text-xs text-[#c8410a] opacity-0 transition-opacity group-hover:opacity-100">
                      {isHu ? "Megnyitás →" : "Open →"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
