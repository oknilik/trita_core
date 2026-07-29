import { prisma } from "@/lib/prisma";
const ORG = "cmroykgno0003itqbc8xxwk54";
async function main() {
  const mode = process.argv[2];
  const user = await prisma.userProfile.findFirst({
    where: { email: { contains: "persona-open-thor" } },
    select: { id: true },
  });
  if (!user) throw new Error("no user");
  if (mode === "setup") {
    await prisma.organizationMember.upsert({
      where: { orgId_userId: { orgId: ORG, userId: user.id } },
      create: { orgId: ORG, userId: user.id, role: "ORG_CONSULTANT" },
      update: { role: "ORG_CONSULTANT", leftAt: null },
    });
    const draft = await prisma.campaign.create({
      data: {
        orgId: ORG,
        name: "TESZT — elvetendő vázlat 2",
        type: "TRUST_360",
        steps: ["TRUST_360"],
        status: "DRAFT",
        createdBy: user.id,
        teamId: (await prisma.team.findFirst({ where: { orgId: ORG }, select: { id: true } }))?.id,
      },
      select: { id: true },
    });
    console.log("draft:", draft.id);
  } else {
    await prisma.organizationMember.deleteMany({ where: { orgId: ORG, userId: user.id, role: "ORG_CONSULTANT" } });
    const leftover = await prisma.campaign.findMany({ where: { orgId: ORG, name: { contains: "TESZT — elvetendő" } }, select: { id: true } });
    if (leftover.length) { await prisma.campaign.deleteMany({ where: { id: { in: leftover.map(l => l.id) } } }); console.log("leftover removed"); }
    console.log("teardown done");
  }
}
main().finally(() => prisma.$disconnect());
