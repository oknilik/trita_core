"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Kliens-oldali redirect diszpécser-oldalakhoz. A page-szintű szerver-
// redirect() Next 16 alatt "Rendered more hooks than during the previous
// render" kliens-hibát dob (vercel/next.js#63121, #78396) — az upstream
// workaround a kliens-oldali átirányítás. A hívó oldal loading-skeletonja
// látszik, amíg a replace lefut.
export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return null;
}
