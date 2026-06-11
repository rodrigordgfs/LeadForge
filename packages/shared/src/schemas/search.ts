import { z } from "zod";

export const BRAZILIAN_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type BrazilianUf = (typeof BRAZILIAN_UFS)[number];

export const brazilianUfSchema = z.enum(BRAZILIAN_UFS);

export const searchFiltersSchema = z.object({
  hasWebsite: z.boolean().optional(),
  noWebsite: z.boolean().optional(),
  minRating: z.number().min(0).max(5).optional(),
  hasWhatsapp: z.boolean().optional(),
  hasInstagram: z.boolean().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const createSearchSchema = z.object({
  segmentId: z.string().min(1),
  subcategoryId: z.string().optional(),
  state: brazilianUfSchema,
  city: z.string().min(1),
  radiusKm: z.number().int().min(1).max(50),
  filters: searchFiltersSchema.optional(),
});

export type CreateSearchInput = z.infer<typeof createSearchSchema>;

export const createSearchResponseSchema = z.object({
  searchJobId: z.string().min(1),
});

export type CreateSearchResponse = z.infer<typeof createSearchResponseSchema>;

export const userSettingsSchema = z.object({
  highOpportunityThreshold: z.number().int().min(0).max(100).default(60),
  proposalDefaults: z
    .object({
      scope: z.string().optional(),
      deadline: z.string().optional(),
      monthlyFee: z.number().optional(),
    })
    .optional(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
