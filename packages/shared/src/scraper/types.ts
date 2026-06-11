import type { SearchFilters } from "../schemas/search.js";

export type { SearchFilters };

export interface ScrapeSearchInput {
  segmentId: string;
  subcategoryId?: string;
  state: string;
  city: string;
  radiusKm: number;
  filters?: SearchFilters;
}

export interface ScrapedBusiness {
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  mapsUrl: string;
}

export interface MapsScraper {
  scrape(input: ScrapeSearchInput): Promise<ScrapedBusiness[]>;
}
