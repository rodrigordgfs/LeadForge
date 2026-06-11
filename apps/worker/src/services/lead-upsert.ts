import { prisma, type Lead } from "@leadforge/db";
import type { ScrapedBusiness } from "@leadforge/shared";

export async function upsertLeadFromScraped(
  business: ScrapedBusiness,
  searchJobId: string,
  userId: string,
): Promise<Lead> {
  const existing = await prisma.lead.findFirst({
    where: {
      searchJobId,
      mapsUrl: business.mapsUrl,
    },
  });

  if (existing) {
    return prisma.lead.update({
      where: { id: existing.id },
      data: {
        name: business.name,
        category: business.category,
        address: business.address,
        city: business.city,
        state: business.state,
        phone: business.phone,
        website: business.website,
        rating: business.rating,
        reviewCount: business.reviewCount,
      },
    });
  }

  return prisma.lead.create({
    data: {
      userId,
      searchJobId,
      name: business.name,
      category: business.category,
      address: business.address,
      city: business.city,
      state: business.state,
      phone: business.phone,
      website: business.website,
      rating: business.rating,
      reviewCount: business.reviewCount,
      mapsUrl: business.mapsUrl,
      status: "novo",
    },
  });
}
