import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeLocale } from "@/lib/i18n";

const isProtectedRoute = createRouteMatcher([
  "/assessment(.*)",
  "/dashboard(.*)",
  "/profile(.*)",
]);

// Observer pages are public (no auth required)
const isPublicRoute = createRouteMatcher([
  "/observe(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  if (isPublicRoute(req)) return;
  if (isProtectedRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: "/sign-in",
      unauthorizedUrl: "/sign-in",
    });
  }

  const cookieLocale = req.cookies.get("trita_locale")?.value;
  if (!cookieLocale) {
    const accept = req.headers.get("accept-language");
    const locale = normalizeLocale(accept);
    const res = NextResponse.next();
    res.cookies.set("trita_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
