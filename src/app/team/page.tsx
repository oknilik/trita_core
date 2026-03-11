import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { FadeIn } from "@/components/landing/FadeIn";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "HR & Team | Trita", robots: { index: false } };
}

export default async function TeamListPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!profile || profile.role !== "MANAGER") redirect("/dashboard");

  const teams = await prisma.team.findMany({
    where: { ownerId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  });

  const isHu = locale !== "en" && locale !== "de";
  const dateLocale = locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU";

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
                {isHu ? "HR & Csapat" : "HR & Team"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-4xl">
                  {isHu ? "Csapataim" : "My Teams"}
                </h1>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {isHu
                  ? `${teams.length} csapat · Csapattagok személyiségprofilja egy helyen`
                  : `${teams.length} team${teams.length !== 1 ? "s" : ""} · View your team's personality profiles together`}
              </p>
            </div>
          </section>
        </FadeIn>

        {/* Create new team */}
        <FadeIn delay={0.05}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              {isHu ? "Új csapat létrehozása" : "Create a new team"}
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              {isHu
                ? "Adj nevet a csapatnak, majd add hozzá a tagokat emailcím alapján."
                : "Give your team a name, then add members by their email address."}
            </p>
            <TeamCreateForm locale={locale} />
          </section>
        </FadeIn>

        {/* Team list */}
        <FadeIn delay={0.1}>
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Csapatok" : "Teams"}{" "}
                <span className="text-sm font-normal text-gray-400">({teams.length})</span>
              </h2>
            </div>

            {teams.length === 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-10 text-center">
                <p className="text-sm text-gray-400">
                  {isHu
                    ? "Még nincs csapatod. Hozz létre egyet fentebb!"
                    : "No teams yet. Create one above!"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                      {team.name}
                    </p>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                      {team._count.members} {isHu ? "tag" : team._count.members === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {isHu ? "Létrehozva: " : "Created "}{team.createdAt.toLocaleDateString(dateLocale)}
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

      </main>
    </div>
  );
}
