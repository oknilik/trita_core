import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgRole } from "@/lib/auth";
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
  const isHu = locale !== "en";

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
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">

        <div>
          <Link
            href={`/org/${orgId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] hover:text-[#c8410a] mb-6 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isHu ? "Vissza a szervezethez" : "Back to organization"}
          </Link>

          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
              {isHu ? "// beállítások" : "// settings"}
            </p>
            <h1 className="font-playfair text-3xl text-[#1a1814] md:text-4xl">
              {org.name}
            </h1>
          </div>
        </div>

        {/* Org name */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// szervezet neve" : "// organization name"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Szervezet neve" : "Organization name"}
          </h2>
          <OrgRenameForm orgId={orgId} currentName={org.name} locale={locale} />
        </section>

        {/* Member roles */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// szerepkörök" : "// roles"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Tagok szerepkörei" : "Member roles"}
          </h2>
          <div className="flex flex-col divide-y divide-[#e8e4dc]">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1a1814]">
                    {m.user.username ?? m.user.email ?? "—"}
                  </p>
                  {m.user.username && (
                    <p className="truncate text-xs text-[#3d3a35]/60">{m.user.email}</p>
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

        {/* Danger zone */}
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-rose-600 mb-1">
            {isHu ? "// veszélyes zóna" : "// danger zone"}
          </p>
          <h2 className="font-playfair text-xl text-rose-900 mb-4">
            {isHu ? "Veszélyes zóna" : "Danger zone"}
          </h2>
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

      </main>
    </div>
  );
}
