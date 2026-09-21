import test from "node:test";
import assert from "node:assert/strict";
import {
  PORTFOLIO_SURFACE_STATE,
  isPortfolioSurfaceActive,
  parkedPortfolioSurfaceForPath,
} from "@/lib/portfolio-parking";

test("P2.2: csak a fókuszon kívüli felületek parkoltak", () => {
  assert.deepEqual(PORTFOLIO_SURFACE_STATE, {
    career: "parked",
    hiring: "active",
    crm: "active",
    blog: "active",
    fakedoor: "parked",
    patternExplorer: "parked",
    publicSharing: "active",
  });

  for (const surface of ["career", "fakedoor", "patternExplorer"] as const) {
    assert.equal(isPortfolioSurfaceActive(surface), false, surface);
  }
  for (const surface of ["crm", "blog", "publicSharing", "hiring"] as const) {
    assert.equal(isPortfolioSurfaceActive(surface), true, surface);
  }
});

test("P2.2: a parkolt oldal- és API-belépők ugyanahhoz a kapuhoz tartoznak", () => {
  const cases = [
    ["/career", "career"],
    ["/api/career/fit", "career"],
    ["/api/profile/career-background", "career"],
    ["/admin/fakedoor/career", "fakedoor"],
    ["/api/career/fakedoor/response", "fakedoor"],
    ["/patterns", "patternExplorer"],
  ] as const;

  for (const [pathname, surface] of cases) {
    assert.equal(parkedPortfolioSurfaceForPath(pathname), surface, pathname);
  }
});

test("P2.2: a zászlóshajó és a hasonló előtagú útvonalak nyitva maradnak", () => {
  for (const pathname of [
    "/",
    "/pilot",
    "/hiring/org_1",
    "/apply/token",
    "/api/manager/candidates/id/resend",
    "/profile/results",
    "/org/org_1",
    "/team/team_1",
    "/tasks",
    "/admin/crm/deal_1",
    "/api/admin/quote/rates",
    "/share/token",
    "/api/profile/share/send",
    "/api/team-reports/report_1",
    "/api/profile/shareholder",
    "/blog",
    "/blog/example",
    "/api/admin/blog",
    // A hírlevél a blog kapuja alatt van (aktív blognál nyitva) — a hasonló
    // előtagú, de NEM modulhoz tartozó utak viszont nem záródhatnak le.
    "/api/newsletter/subscribe",
    "/newsletter/confirmed",
    "/blogger",
    "/newsletters-archive",
    "/patterns-library",
    // Meleg-lead / kívánságlista végpont — élő felület hívja (TeamInterestBanner),
    // nem eshet a fakedoor kapu alá.
    "/api/features/interest",
    "/api/feature-interest",
  ]) {
    assert.equal(parkedPortfolioSurfaceForPath(pathname), null, pathname);
  }
});
