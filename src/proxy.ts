import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeLocale } from "@/lib/i18n";

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

const handler = clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return nextWithPathname(req);
  }

  // Redirect authenticated users away from sign-in/sign-up to dashboard
  if (isAuthRoute(req)) {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return nextWithPathname(req);
  }

  if (isPublicRoute(req)) {
    return nextWithPathname(req);
  }
  if (isProtectedRoute(req)) {
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
  // Bypass clerkMiddleware for SSO callbacks — the AuthenticateWithRedirectCallback
  // component handles the OAuth flow client-side. Running clerkMiddleware on these
  // routes causes an infinite redirect loop in development (ngrok/tunnel).
  if (req.nextUrl.pathname.includes("/sso-callback")) {
    return nextWithPathname(req);
  }
  return handler(req, event);
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
