// Az e2e webServer (next dev) render-elési minimum-env-je. CI-ben csak a
// teszt-DB env érkezhet: Clerk-kulcs nélkül az app oldalak SSR-je kivételt
// dobna. Ezek a kulcsok kizárólag hermetikus, signed-out tesztértékek.
const E2E_RUNTIME_ENV_FALLBACKS = {
  // "clerk.example.com$" base64-ben — nem old fel élő Clerk-instance-t.
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_Y2xlcmsuZXhhbXBsZS5jb20k",
  CLERK_SECRET_KEY: "sk_live_dummy_e2e_only",
  RESEND_API_KEY: "re_dummy_e2e_only",
};

export function resolveE2eRuntimeEnv(processEnv = process.env) {
  const env = {};
  for (const [key, fallback] of Object.entries(E2E_RUNTIME_ENV_FALLBACKS)) {
    if (!processEnv[key]) env[key] = fallback;
  }
  return env;
}
