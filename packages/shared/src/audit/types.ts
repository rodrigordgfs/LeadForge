export interface SiteAuditResult {
  hasRealWebsite: boolean;
  sslValid: boolean;
  mobileResponsive: boolean;
  ownDomain: boolean;
  seoBasics: {
    title: boolean;
    metaDescription: boolean;
    h1: boolean;
  };
  psi?: {
    performanceScore: number;
    lcp: number;
    cls: number;
    seoScore: number;
  };
  problems: string[];
  opportunities: string[];
}

export interface SiteAuditor {
  audit(url: string): Promise<SiteAuditResult>;
}

export interface SocialSignals {
  hasInstagram?: boolean;
  hasFacebook?: boolean;
  hasLinkedIn?: boolean;
  hasTikTok?: boolean;
  activeSocial?: boolean;
}

export interface GoogleBusinessSignals {
  profileVerified?: boolean;
  rating?: number;
  reviewCount?: number;
}
