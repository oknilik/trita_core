"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

const DRAFT_KEY = "trita_draft_HEXACO";

export default function TryCompletePage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const [hasDraft, setHasDraft] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) {
      router.replace("/try");
      return;
    }
    try {
      const draft = JSON.parse(stored);
      setHasDraft(Object.keys(draft.answers ?? {}).length > 0);
    } catch {
      router.replace("/try");
    }
  }, [router]);

  // If already signed in, go claim the results
  useEffect(() => {
    if (isSignedIn) router.replace("/try/claim");
  }, [isSignedIn, router]);

  if (hasDraft === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c17f4a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="font-fraunces mb-10 inline-flex text-2xl font-black tracking-tight text-ink"
        >
          <span className="text-[#3d6b5e]">t</span>rit<span className="text-[#c17f4a]">a</span>
        </Link>

        {/* Celebration */}
        <div className="mb-6">
          <p className="mb-1 text-3xl">🎉</p>
          <h1 className="font-fraunces text-2xl text-ink">
            {isHu ? "Kész vagy!" : "You're done!"}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-body">
            {isHu
              ? "Az eredményed elkészült. Hozz létre egy fiókot, és azonnal megtekintheted a személyiségprofilodat."
              : "Your results are ready. Create an account to see your personality profile."}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/sign-up?redirect_url=/try/claim"
            className="flex min-h-[52px] items-center justify-center rounded-xl bg-[#c17f4a] px-6 text-[15px] font-bold text-white shadow-md shadow-[#c17f4a]/20 transition-all hover:-translate-y-px hover:brightness-[1.06]"
          >
            {isHu ? "Regisztrálok és megnézem →" : "Register & see my results →"}
          </Link>

          <Link
            href="/sign-in?redirect_url=/try/claim"
            className="flex min-h-[52px] items-center justify-center rounded-xl border border-[#e8e0d3] bg-white px-6 text-[15px] font-medium text-ink-body transition-colors hover:border-[#c17f4a]/40 hover:text-[#c17f4a]"
          >
            {isHu ? "Már van fiókom — bejelentkezés" : "I already have an account — log in"}
          </Link>
        </div>

        {/* Privacy note */}
        <p className="mt-6 text-center text-xs text-[#8a8a9a]">
          {isHu
            ? "A regisztrációval elfogadod az adatvédelmi tájékoztatónkat."
            : "By registering you accept our privacy policy."}
          {" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#4a4a5e]">
            {isHu ? "Részletek" : "Details"}
          </Link>
        </p>
      </div>
    </div>
  );
}
