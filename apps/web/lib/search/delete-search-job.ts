import { prisma } from "@leadforge/db";
import {
  cancelAnalyzeJobsForSearch,
  cancelSearchQueueJob,
  markSearchJobCancelled,
} from "@leadforge/queue";

export async function deleteSearchJobForUser(
  userId: string,
  searchJobId: string,
): Promise<boolean> {
  const job = await prisma.searchJob.findFirst({
    where: { id: searchJobId, userId },
    select: { id: true, status: true },
  });

  if (!job) {
    return false;
  }

  await markSearchJobCancelled(searchJobId);
  await cancelSearchQueueJob(searchJobId);
  await cancelAnalyzeJobsForSearch(searchJobId);

  await prisma.searchJob.delete({
    where: { id: searchJobId },
  });

  return true;
}
