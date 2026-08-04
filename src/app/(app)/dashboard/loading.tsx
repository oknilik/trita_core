import { RedirectLoader } from "@/components/navigation/RedirectLoader";

// A /dashboard tiszta elosztó (azonnal átirányít) — a betöltő állapota is
// az átirányítás-loader, nem oldal-alakú skeleton (UX-audit #4: a sötét
// hero-skeleton „fekete villanásnak" hatott minden home-kattintásnál).
export default function DashboardLoading() {
  return <RedirectLoader />;
}
