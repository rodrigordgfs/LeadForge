/**
 * Google Maps DOM selectors — centralized for resilience when Maps UI changes.
 */
export const SELECTORS = {
  captcha: "#captcha-form, [data-testid='captcha'], .g-recaptcha",
  resultsFeed: '[role="feed"]',
  resultCard: '[role="feed"] [role="article"]',
  businessName: '[data-testid="business-name"]',
  category: '[data-testid="category"]',
  address: '[data-testid="address"]',
  city: '[data-testid="city"]',
  state: '[data-testid="state"]',
  phone: '[data-testid="phone"]',
  website: 'a[data-testid="website"]',
  rating: '[data-testid="rating"]',
  reviewCount: '[data-testid="review-count"]',
  mapsLink: 'a[data-testid="maps-link"]',
  detailPanel: '[data-testid="detail-panel"]',
  detailPhone: '[data-testid="detail-phone"]',
  detailWebsite: 'a[data-testid="detail-website"]',
} as const;

export type SelectorKey = keyof typeof SELECTORS;
