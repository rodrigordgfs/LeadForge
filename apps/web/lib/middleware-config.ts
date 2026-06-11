export const PUBLIC_ROUTE_PATTERNS = [
  "/api/health",
  "/sign-in(.*)",
  "/sign-up(.*)",
] as const;

export function matchRoutePattern(pathname: string, pattern: string): boolean {
  if (!pattern.includes("(.*)")) {
    return pathname === pattern;
  }

  const prefix = pattern.replace("(.*)", "");
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) =>
    matchRoutePattern(pathname, pattern),
  );
}

export const MIDDLEWARE_MATCHER = [
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
  "/__clerk/(.*)",
] as const;
