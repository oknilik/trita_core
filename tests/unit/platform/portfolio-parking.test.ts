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
    hiring: "parked",
    crm: "active",
    blog: "active",
    fakedoor: "parked",
    patternExplorer: "parked",
    publicSharing: "active",
  });

  for (const surface of ["career", "hiring", "fakedoor", "patternExplorer"] as const) {
    assert.equal(isPortfolioSurfaceActive(surface), false, surface);
  }
  for (const surface of ["crm", "blog", "publicSharing"] as const) {
    assert.equal(isPortfolioSurfaceActive(surface), true, surface);
  }
});

test("P2.2: a parkolt oldal- és API-belépők ugyanahhoz a kapuhoz tartoznak", () => {
  const cases = [
    ["/career", "career"],
    ["/api/career/fit", "career"],
    ["/api/profile/career-background", "career"],
    ["/hiring/org_1", "hiring"],
    ["/apply/token", "hiring"],
    ["/api/manager/candidates/id/resend", "hiring"],
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
    "/blogger",
    "/patterns-library",
    // Meleg-lead / kívánságlista végpont — élő felület hívja (TeamInterestBanner),
    // nem eshet a fakedoor kapu alá.
    "/api/features/interest",
    "/api/feature-interest",
  ]) {
    assert.equal(parkedPortfolioSurfaceForPath(pathname), null, pathname);
  }
});
