import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buildSignInPath } from "@/lib/navigation/auth-redirects";

/** Server-component fallback arra az esetre, ha a middleware kapuja kimarad. */
export async function redirectToSignIn(): Promise<never> {
  const requestHeaders = await headers();
  const returnTo =
    requestHeaders.get("x-request-target") ?? requestHeaders.get("x-pathname") ?? null;
  redirect(buildSignInPath(returnTo));
}
