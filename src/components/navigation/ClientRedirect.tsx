"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RedirectLoader } from "./RedirectLoader";

// Kliens-oldali redirect diszpécser-oldalakhoz. A page-szintű szerver-
// redirect() Next 16 alatt "Rendered more hooks than during the previous
// render" kliens-hibát dob (vercel/next.js#63121, #78396) — az upstream
// workaround a kliens-oldali átirányítás. Amíg a replace lefut, a minimál
// márka-loader látszik (UX-audit #4) — nem üres/sötét képernyő.
export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <>
      {/* No-JS fallback: a meta-refresh azt teszi, amit a (Next 16-bug miatt
          nem használható) szerver-redirect() tenne — kliens-JS nélkül is
          célba ér a diszpécser. React 19 a komponensben renderelt <meta>-t a
          <head>-be emeli; ha a hydration utáni router.replace előbb fut le,
          a függő refresh magától elhal. A `to` mindig belső journey-cél
          (nem user-input). A 2026-08-05-i e2e CI-futásban a /dashboard a
          router.replace-re várva ragadt be — ez az út JS-állapottól
          függetlenül determinisztikus. */}
      <meta httpEquiv="refresh" content={`0;url=${to}`} />
      <RedirectLoader />
    </>
  );
}
