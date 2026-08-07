import Link from "next/link";
import { getServerLocale } from "@/lib/i18n-server";

// A streamelt notFound() (pl. tag-dossié kilépett tagra) nem eshet vissza a
// root not-found redirect("/")-jére: streaming közben a redirect kliens-oldali
// kivételként csapódik le. Itt tényleges 404-oldalt renderelünk.
export default async function AppNotFound() {
  const locale = await getServerLocale();
  const isHu = locale !== "en";

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <p className="font-fraunces text-title text-ink">
          {isHu ? "Ez az oldal nem található" : "This page could not be found"}
        </p>
        <p className="mt-3 text-body text-muted">
          {isHu
            ? "Lehet, hogy a hivatkozás elavult, vagy nincs jogosultságod az oldalhoz."
            : "The link may be outdated, or you may not have access to this page."}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-bronze px-6 text-label font-medium text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90"
        >
          {isHu ? "Vissza a vezérlőre" : "Back to the dashboard"}
        </Link>
      </div>
    </main>
  );
}
