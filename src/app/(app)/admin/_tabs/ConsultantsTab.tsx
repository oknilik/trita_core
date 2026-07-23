import { prisma } from "@/lib/prisma";
import { AdminConsultantsSection } from "@/app/(app)/admin/_components/AdminConsultantsSection";

// Tanácsadók fül — platform-szintű tanácsadó-onboarding
export async function ConsultantsTab() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return <AdminConsultantsSection orgs={orgs} />;
}
