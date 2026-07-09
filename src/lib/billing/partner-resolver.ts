/**
 * C2 — Partner resolver service
 *
 * Központi partner-resolve logika a Billingo számlázáshoz.
 * Self purchase → user partner, org/team → org partner.
 */

import { prisma } from "@/lib/prisma";
import { findOrCreatePartner, updatePartnerIfNeeded } from "./billingo-client";

export interface PartnerResolutionInput {
  userId?: string | null;
  organizationId?: string | null;
  email: string;
  name: string;
  countryCode: string;
  taxNumber?: string | null;
  euVatNumber?: string | null;
}

export interface ResolvedPartner {
  billingoPartnerId: number;
  linkId: string;
}

export async function resolvePartner(
  input: PartnerResolutionInput,
): Promise<ResolvedPartner> {
  // Check existing link
  const existingLink = input.organizationId
    ? await prisma.billingoPartnerLink.findFirst({
        where: { organizationId: input.organizationId },
      })
    : input.userId
      ? await prisma.billingoPartnerLink.findFirst({
          where: { userId: input.userId },
        })
      : null;

  if (existingLink) {
    // Update partner if email/tax changed
    const needsUpdate =
      existingLink.email !== input.email ||
      existingLink.taxNumber !== (input.taxNumber ?? null) ||
      existingLink.countryCode !== input.countryCode;

    if (needsUpdate) {
      await updatePartnerIfNeeded(Number(existingLink.billingoPartnerId), {
        name: input.name,
        email: input.email,
        countryCode: input.countryCode,
        taxNumber: input.taxNumber ?? undefined,
      });

      await prisma.billingoPartnerLink.update({
        where: { id: existingLink.id },
        data: {
          email: input.email,
          countryCode: input.countryCode,
          taxNumber: input.taxNumber,
          euVatNumber: input.euVatNumber,
        },
      });
    }

    return {
      billingoPartnerId: Number(existingLink.billingoPartnerId),
      linkId: existingLink.id,
    };
  }

  // Create new partner in Billingo
  const billingoPartnerId = await findOrCreatePartner({
    name: input.name,
    email: input.email,
    countryCode: input.countryCode,
    taxNumber: input.taxNumber ?? undefined,
  });

  // Save link
  const link = await prisma.billingoPartnerLink.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      billingoPartnerId: String(billingoPartnerId),
      email: input.email,
      countryCode: input.countryCode,
      taxNumber: input.taxNumber,
      euVatNumber: input.euVatNumber,
      currency: "EUR",
      locale: "hu",
    },
  });

  return {
    billingoPartnerId,
    linkId: link.id,
  };
}

/**
 * Resolve partner for a purchase based on product type.
 * Self purchases → user as partner.
 * Team/org purchases → organization as partner.
 */
export async function resolvePartnerForPurchase(input: {
  productType: string;
  userId: string;
  organizationId?: string | null;
}): Promise<PartnerResolutionInput> {
  const isOrgLevel = input.productType !== "self_plus";

  if (isOrgLevel && input.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: {
        name: true,
        owner: { select: { email: true } },
      },
    });

    return {
      organizationId: input.organizationId,
      email: org?.owner?.email ?? "",
      name: org?.name ?? "Organization",
      countryCode: "HU", // TODO: from org billing profile
    };
  }

  const user = await prisma.userProfile.findUnique({
    where: { id: input.userId },
    select: { email: true, username: true },
  });

  return {
    userId: input.userId,
    email: user?.email ?? "",
    name: user?.username ?? "User",
    countryCode: "HU", // TODO: from user billing profile
  };
}
