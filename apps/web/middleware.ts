import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import {
  MIDDLEWARE_MATCHER,
  PUBLIC_ROUTE_PATTERNS,
} from "./lib/middleware-config";

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [...MIDDLEWARE_MATCHER],
};
