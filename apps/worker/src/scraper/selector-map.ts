/**
 * Google Maps DOM selectors — centralized for resilience when Maps UI changes.
 * Fixture/test IDs are kept for unit tests; live selectors target production Maps.
 */
export const SELECTORS = {
  captcha:
    "#captcha-form, [data-testid='captcha'], .g-recaptcha, iframe[src*='recaptcha']",
  resultsFeed: 'div[role="feed"]',
  resultCard: 'div[role="feed"] div[role="article"]',
  /** Fixture-only (maps-results.html) */
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
  /** Production Google Maps */
  placeLink: 'a[href*="/maps/place/"], a.hfpxzc',
  listingName: ".qBF1Pd",
  listingMeta: ".W4Efsd",
  listingRating: ".MW4etd",
  listingReviewCount: ".UY7F9, .ZkP5Je",
  liveDetailPhone:
    'button[data-item-id^="phone:tel"], button[aria-label*="Phone"], button[aria-label*="Telefone"]',
  liveDetailWebsite:
    'a[data-item-id="authority"], a[aria-label*="Website"], a[aria-label*="Site"]',
} as const;

export type SelectorKey = keyof typeof SELECTORS;
