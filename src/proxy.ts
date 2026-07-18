import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeLocale } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

function nextWithPathname(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
}

const isProtectedRoute = createRouteMatcher([
  "/assessment(.*)",
  "/dashboard(.*)",
  "/profile(.*)",
  "/manager(.*)",
  "/org(.*)",
  "/billing(.*)",
  "/admin(.*)",
  "/team(.*)",
  "/onboarding(.*)",
]);

// Public pages (no auth required)
const isPublicRoute = createRouteMatcher([
  "/observe(.*)",
  "/share(.*)",
  "/apply(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/try(.*)",
]);

const isAuthRoute = createRouteMatcher(["/sign-in", "/sign-up"]);

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

function isE2EAuthBypassEnabled(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.TRITA_E2E_AUTH_BYPASS !== "1") return false;
  const value = req.cookies.get(E2E_AUTH_COOKIE_NAME)?.value?.trim();
  return Boolean(value);
}

const handler = clerkMiddleware(async (auth, req) => {
  // SSO-callback: semmilyen redirect-logika nem futhat (dev/tunnel loop-ok
  // ellen), DE a clerkMiddleware-en belül maradunk, hogy a downstream
  // auth()-hívások (pl. root layout) Clerk-kontextust kapjanak — enélkül
  // "auth() was called but Clerk can't detect clerkMiddleware()" hibát dob.
  if (req.nextUrl.pathname.includes("/sso-callback")) {
    return nextWithPathname(req);
  }

  const e2eBypass = isE2EAuthBypassEnabled(req);

  if (req.nextUrl.pathname.startsWith("/api")) {
    return nextWithPathname(req);
  }

  // Redirect authenticated users away from sign-in/sign-up to the central journey handoff.
  if (isAuthRoute(req)) {
    const { userId } = await auth();
    if (userId || e2eBypass) {
      return NextResponse.redirect(new URL(JOURNEY_HOME_HANDOFF_PATH, req.url));
    }
    return nextWithPathname(req);
  }

  if (isPublicRoute(req)) {
    return nextWithPathname(req);
  }
  if (isProtectedRoute(req)) {
    if (e2eBypass) {
      return nextWithPathname(req);
    }
    const homeUrl = new URL("/", req.url).toString();
    await auth.protect({
      unauthenticatedUrl: homeUrl,
      unauthorizedUrl: homeUrl,
    });
  }

  const cookieLocale = req.cookies.get("trita_locale")?.value;
  if (!cookieLocale) {
    const accept = req.headers.get("accept-language");
    const locale = normalizeLocale(accept);
    const res = nextWithPathname(req);
    res.cookies.set("trita_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  return nextWithPathname(req);
});

export function proxy(req: NextRequest, event: import("next/server").NextFetchEvent) {
  // Az sso-callback speciális kezelése a clerkMiddleware-en BELÜL történik
  // (ld. handler eleje) — a teljes bypass a layout auth() hívását törte el.
  return handler(req, event);
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
