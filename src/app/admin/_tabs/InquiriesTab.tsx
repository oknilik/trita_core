import { prisma } from "@/lib/prisma";
import { AdminInquiriesSection } from "@/app/admin/_components/AdminInquiriesSection";

// Kérdések fül — beérkezett megkeresések (contact form + in-app csatorna)
export async function InquiriesTab() {
  const [inquiries, orgs] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        topic: true,
        message: true,
        status: true,
        adminNote: true,
        createdAt: true,
        userProfile: { select: { id: true, username: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <AdminInquiriesSection
      inquiries={inquiries.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        company: row.company,
        topic: row.topic,
        message: row.message,
        status: row.status,
        adminNote: row.adminNote,
        createdAt: row.createdAt.toISOString(),
        user: row.userProfile,
        org: row.organization,
      }))}
      orgs={orgs}
    />
  );
}
