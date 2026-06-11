const NOT_REAL_WEBSITE_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linktr.ee",
  "linktree.com",
  "yelp.com",
] as const;

const THIRD_PARTY_SUBDOMAIN_PATTERNS = [
  "wixsite.com",
  "wordpress.com",
  "blogspot.com",
  "squarespace.com",
  "weebly.com",
  "godaddysites.com",
] as const;

export interface UrlClassification {
  hasRealWebsite: boolean;
  ownDomain: boolean;
  host: string;
  normalizedUrl: string;
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("file://")) {
    return trimmed;
  }

  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function matchesHost(hostname: string, candidate: string): boolean {
  return hostname === candidate || hostname.endsWith(`.${candidate}`);
}

export function classifyUrl(url: string): UrlClassification {
  const normalizedUrl = normalizeUrl(url);

  if (normalizedUrl.startsWith("file://")) {
    return {
      hasRealWebsite: true,
      ownDomain: true,
      host: "local-fixture",
      normalizedUrl,
    };
  }

  const host = extractHostname(normalizedUrl);

  if (!host) {
    return {
      hasRealWebsite: false,
      ownDomain: false,
      host: "",
      normalizedUrl,
    };
  }

  const isSocialOnly = NOT_REAL_WEBSITE_HOSTS.some((candidate) =>
    matchesHost(host, candidate),
  );

  const isThirdParty = THIRD_PARTY_SUBDOMAIN_PATTERNS.some((candidate) =>
    matchesHost(host, candidate),
  );

  return {
    hasRealWebsite: !isSocialOnly,
    ownDomain: !isSocialOnly && !isThirdParty,
    host,
    normalizedUrl,
  };
}
