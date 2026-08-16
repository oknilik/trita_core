import test from "node:test";
import assert from "node:assert/strict";
import {
  PORTFOLIO_SURFACE_STATE,
  isPortfolioSurfaceActive,
  parkedPortfolioSurfaceForPath,
} from "@/lib/portfolio-parking";

test("P2.2: a széles portfólió minden kijelölt felülete aktívan parkolt", () => {
  assert.deepEqual(PORTFOLIO_SURFACE_STATE, {
    career: "parked",
    hiring: "parked",
    crm: "parked",
    blog: "parked",
    fakedoor: "parked",
    patternExplorer: "parked",
    publicSharing: "parked",
  });

  for (const surface of Object.keys(PORTFOLIO_SURFACE_STATE)) {
    assert.equal(
      isPortfolioSurfaceActive(surface as keyof typeof PORTFOLIO_SURFACE_STATE),
      false,
    );
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
    ["/admin/crm/deal_1", "crm"],
    ["/api/admin/quote/rates", "crm"],
    ["/blog/example", "blog"],
    ["/api/admin/blog", "blog"],
    ["/admin/fakedoor/career", "fakedoor"],
    ["/api/career/fakedoor/response", "fakedoor"],
    ["/patterns", "patternExplorer"],
    ["/share/token", "publicSharing"],
    ["/api/profile/share/send", "publicSharing"],
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
    "/api/team-reports/report_1",
    "/api/profile/shareholder",
    "/blogger",
    "/patterns-library",
  ]) {
    assert.equal(parkedPortfolioSurfaceForPath(pathname), null, pathname);
  }
});

