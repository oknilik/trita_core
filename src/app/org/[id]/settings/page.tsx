import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgRole } from "@/lib/auth";
import { FadeIn } from "@/components/landing/FadeIn";
import { OrgRenameForm } from "@/components/org/OrgRenameForm";
import { OrgDeactivateButton } from "@/components/org/OrgDeactivateButton";
import { OrgMemberRoleEditor } from "@/components/org/OrgMemberRoleEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet beállítások | Trita", robots: { index: false } };
}

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, org } = await requireOrgRole(orgId, "ORG_ADMIN");
  const isHu = locale !== "en" && locale !== "de";

  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    orderBy: { joinedAt: "asc" },
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, email: true, username: true } },
    },
  });

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">

        <FadeIn>
          <div>
            <Link
              href={`/org/${orgId}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-6"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              {isHu ? "Vissza a szervezethez" : "Back to organization"}
            </Link>

            <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" aria-hidden="true" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {isHu ? "Beállítások" : "Settings"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-3xl">
                    {org.name}
                  </h1>
                </div>
              </div>
            </section>
          </div>
        </FadeIn>

        {/* Org name */}
        <FadeIn delay={0.05}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Szervezet neve" : "Organization name"}
              </h2>
            </div>
            <OrgRenameForm orgId={orgId} currentName={org.name} locale={locale} />
          </section>
        </FadeIn>

        {/* Member roles */}
        <FadeIn delay={0.1}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Tagok szerepkörei" : "Member roles"}
              </h2>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {m.user.username ?? m.user.email ?? "—"}
                    </p>
                    {m.user.username && (
                      <p className="truncate text-xs text-gray-400">{m.user.email}</p>
                    )}
                  </div>
                  <OrgMemberRoleEditor
                    orgId={orgId}
                    userId={m.userId}
                    currentRole={m.role}
                    isSelf={m.userId === profileId}
                    locale={locale}
                  />
                </div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* Danger zone */}
        <FadeIn delay={0.15}>
          <section className="rounded-xl border border-rose-100 bg-rose-50 p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-rose-400 to-rose-600" />
              <h2 className="text-lg font-semibold text-rose-900">
                {isHu ? "Veszélyes zóna" : "Danger zone"}
              </h2>
            </div>
            <p className="mb-4 text-sm text-rose-700">
              {isHu
                ? "A szervezet deaktiválása után tagjai nem tudnak bejelentkezni az org-hoz kötött felületekre."
                : "Deactivating the organization will block members from accessing org-scoped pages."}
            </p>
            {org.status === "INACTIVE" ? (
              <p className="text-sm font-semibold text-rose-800">
                {isHu ? "A szervezet már inaktív." : "Organization is already inactive."}
              </p>
            ) : (
              <OrgDeactivateButton orgId={orgId} locale={locale} />
            )}
          </section>
        </FadeIn>

      </main>
    </div>
  );
}
