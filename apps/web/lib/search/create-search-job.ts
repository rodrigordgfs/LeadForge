import { prisma } from "@leadforge/db";
import { enqueueSearchJob } from "@leadforge/queue";
import {
  createSearchSchema,
  type CreateSearchInput,
  type CreateSearchResponse,
} from "@leadforge/shared";

import { validateSegmentInput } from "./validate-segment.js";

export interface CreateSearchJobResult {
  ok: true;
  data: CreateSearchResponse;
}

export interface CreateSearchJobError {
  ok: false;
  status: 400;
  message: string;
}

export async function createSearchJob(
  userId: string,
  body: unknown,
): Promise<CreateSearchJobResult | CreateSearchJobError> {
  const parsed = createSearchSchema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors.map((e) => e.message).join("; "),
    };
  }

  const segmentError = validateSegmentInput(parsed.data);
  if (segmentError) {
    return { ok: false, status: 400, message: segmentError };
  }

  const input: CreateSearchInput = parsed.data;

  const searchJob = await prisma.searchJob.create({
    data: {
      userId,
      segmentId: input.segmentId,
      subcategoryId: input.subcategoryId,
      state: input.state,
      city: input.city,
      radiusKm: input.radiusKm,
      filtersJson: input.filters ?? undefined,
    },
  });

  try {
    await enqueueSearchJob(
      {
        searchJobId: searchJob.id,
        userId,
        segmentId: input.segmentId,
        subcategoryId: input.subcategoryId,
        state: input.state,
        city: input.city,
        radiusKm: input.radiusKm,
        filters: input.filters,
      },
      searchJob.id,
    );
  } catch (error) {
    await prisma.searchJob.delete({ where: { id: searchJob.id } });
    throw error;
  }

  return { ok: true, data: { searchJobId: searchJob.id } };
}
