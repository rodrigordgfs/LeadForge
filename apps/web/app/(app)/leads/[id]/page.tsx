import { notFound } from "next/navigation";

import { LeadDetail, type LeadDetailData } from "@/components/leads/lead-detail";
import { getLeadDetailForUser } from "@/lib/leads/get-lead-detail";
import { requireAuthUser } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const user = await requireAuthUser();
  const { id } = await params;
  const lead = await getLeadDetailForUser(user.id, id);

  if (!lead) {
    notFound();
  }

  return <LeadDetail lead={lead as LeadDetailData} />;
}
