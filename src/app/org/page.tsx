import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { FadeIn } from "@/components/landing/FadeIn";
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
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Hero */}
        <FadeIn>
          <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40 md:p-12">
            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 via-purple-500/15 to-pink-500/15 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/10 to-pink-500/10 blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                {isHu ? "KKV & Csapat" : "SME & Team"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-4xl">
                  {isHu ? "Szervezetek" : "Organizations"}
                </h1>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {memberships.length > 0
                  ? isHu
                    ? "Csapatprofil, heatmap, tagkezelés"
                    : "Team profiles, heatmap, member management"
                  : isHu
                    ? "Hozz létre szervezetet és hívd meg csapatodat"
                    : "Create an organization and invite your team"}
              </p>
            </div>
          </section>
        </FadeIn>

        {/* Create new org — only if not yet in one */}
        {memberships.length === 0 && (
          <FadeIn delay={0.05}>
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">
                {isHu ? "Új szervezet" : "New organization"}
              </h2>
              <p className="mb-5 text-sm text-gray-500">
                {isHu
                  ? "Adj nevet a szervezetnek, majd hívd meg a csapattagokat."
                  : "Give your organization a name, then invite team members."}
              </p>
              <OrgCreateForm locale={locale} />
            </section>
          </FadeIn>
        )}

        {/* Org list */}
        {memberships.length > 0 && (
          <FadeIn delay={0.1}>
            <section className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Szervezeteim" : "My organizations"}{" "}
                  <span className="text-sm font-normal text-gray-400">({memberships.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {memberships.map(({ org, role }) => (
                  <Link
                    key={org.id}
                    href={`/org/${org.id}`}
                    className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                        {org.name}
                      </p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        role === "ORG_ADMIN"
                          ? "bg-indigo-50 text-indigo-600"
                          : role === "ORG_MANAGER"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {role === "ORG_ADMIN"
                          ? "Admin"
                          : role === "ORG_MANAGER"
                          ? isHu ? "Menedzser" : "Manager"
                          : isHu ? "Tag" : "Member"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {org._count.members} {isHu ? "tag" : org._count.members === 1 ? "member" : "members"}
                        {" · "}
                        {org._count.teams} {isHu ? "csapat" : org._count.teams === 1 ? "team" : "teams"}
                        {" · "}
                        {org.createdAt.toLocaleDateString(dateLocale)}
                      </p>
                      <span className="text-xs font-semibold text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
                        {isHu ? "Megnyitás →" : "Open →"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </FadeIn>
        )}

      </main>
    </div>
  );
}
