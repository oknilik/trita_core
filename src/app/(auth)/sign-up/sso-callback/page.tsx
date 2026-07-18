import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SignUpSSOCallbackPage() {
  return (
    <>
      {/* A Clerk Smart CAPTCHA ide renderel az OAuth-transfer sign-up alatt —
          enélkül Invisible CAPTCHA fallback + konzol-figyelmeztetés jönne. */}
      <div id="clerk-captcha" />
      <AuthenticateWithRedirectCallback />
    </>
  );
}
