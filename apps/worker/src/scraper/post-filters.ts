import type { SearchFilters, ScrapedBusiness } from "@leadforge/shared";

function isWhatsappCapable(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return false;
  }

  const mobileDigitIndex = digits.length - 9;
  return digits.charAt(mobileDigitIndex) === "9";
}

export function applyPostFilters(
  businesses: ScrapedBusiness[],
  filters?: SearchFilters,
): ScrapedBusiness[] {
  if (!filters) {
    return businesses;
  }

  return businesses.filter((business) => {
    if (
      filters.minRating !== undefined &&
      (business.rating ?? 0) < filters.minRating
    ) {
      return false;
    }

    if (filters.hasWebsite === true && !business.website) {
      return false;
    }

    if (filters.noWebsite === true && business.website) {
      return false;
    }

    if (filters.hasWhatsapp === true && !isWhatsappCapable(business.phone ?? "")) {
      return false;
    }

    if (filters.hasInstagram === true) {
      return false;
    }

    return true;
  });
}
