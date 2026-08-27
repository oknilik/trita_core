import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { parkedPortfolioSurfaceForPath } from "@/lib/portfolio-parking";
import { buildSignInPath, sanitizeInternalRedirect } from "@/lib/navigation/auth-redirects";

function nextWithPathname(req: NextRequest) {
  // Request-korreláció: minden kérés kap egy x-request-id-t (a bejövőt
  // tiszteletben tartjuk — pl. retry/proxy láncnál), és a REQUEST
  // fejlécekre is felkerül, hogy a route handlerek / server componentek
  // headers()-szel olvashassák (getRequestLogger). A response-fejléc a
  // kliens-oldali hibabejelentéshez adja vissza ugyanazt az id-t.
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  requestHeaders.set("x-request-target", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-request-id", requestId);
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
  "/advisory(.*)",
  "/career(.*)",
  "/email-preferences(.*)",
  "/interaction(.*)",
  "/tasks(.*)",
]);

// Public pages (no auth required)
const isPublicRoute = createRouteMatcher([
  "/self-awareness",
  "/team-dynamics",
  "/observe(.*)",
  "/share(.*)",
  "/apply(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-out(.*)",
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
  // P2.2 portfólió-parkolás: ugyanaz a központi kapu zárja le a publikus,
  // belépett és API-belépőket. A modulok és adataik a repóban/adatbázisban
  // maradnak, de rejtett mélylinkkel sem válhatnak véletlenül élő termékké.
  const parkedSurface = parkedPortfolioSurfaceForPath(req.nextUrl.pathname);
  if (parkedSurface) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "FEATURE_PARKED" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // SSO-callback: semmilyen redirect-logika nem futhat (dev/tunnel loop-ok
  // ellen), DE a clerkMiddleware-en belül maradunk, hogy a downstream
  // auth()-hívások (pl. root layout) Clerk-kontextust kapjanak – enélkül
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
      const returnTo = sanitizeInternalRedirect(req.nextUrl.searchParams.get("redirect_url"));
      return NextResponse.redirect(new URL(returnTo ?? JOURNEY_HOME_HANDOFF_PATH, req.url));
    }
    return nextWithPathname(req);
  }

  // Bejelentkezett user a root-on: HTTP-redirect a journey-kapura még a
  // render előtt. A page-szintű szerver-redirect() Next 16 alatt kliens-
  // oldali "Rendered more hooks" hibát dob (vercel/next.js#63121, #78396) –
  // a middleware-redirect sima 307, nem érinti a kliens Routert.
  if (req.nextUrl.pathname === "/") {
    const { userId } = await auth();
    if (userId || e2eBypass) {
      return NextResponse.redirect(new URL(JOURNEY_HOME_HANDOFF_PATH, req.url));
    }
  }

  if (isPublicRoute(req)) {
    return nextWithPathname(req);
  }
  if (isProtectedRoute(req)) {
    if (e2eBypass) {
      return nextWithPathname(req);
    }
    const requestedPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    const signInUrl = new URL(buildSignInPath(requestedPath), req.url).toString();
    await auth.protect({
      unauthenticatedUrl: signInUrl,
      unauthorizedUrl: signInUrl,
    });
  }

  const cookieLocale = req.cookies.get("trita_locale")?.value;
  if (!cookieLocale) {
    const res = nextWithPathname(req);
    res.cookies.set("trita_locale", DEFAULT_LOCALE, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  return nextWithPathname(req);
});

export function proxy(req: NextRequest, event: import("next/server").NextFetchEvent) {
  // Az sso-callback speciális kezelése a clerkMiddleware-en BELÜL történik
  // (ld. handler eleje) – a teljes bypass a layout auth() hívását törte el.
  return handler(req, event);
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
