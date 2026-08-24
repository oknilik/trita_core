import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const route = readFileSync(
  join(
    process.cwd(),
    "src/app/api/org/[id]/campaigns/[campaignId]/route.ts",
  ),
  "utf8",
);

test("CAMPAIGN_LAUNCHED is awaited and participates in ACTIVE retry recovery", () => {
  const launchHelper = route.match(
    /async function notifyCampaignLaunch[\s\S]*?\n}\n/,
  )?.[0];
  assert.ok(launchHelper, "the awaited campaign launch helper must exist");
  assert.match(launchHelper, /await handleCampaignLaunched\(params\)/);

  const helper = route.match(
    /async function reconcileActiveCampaignNotifications[\s\S]*?\n}\n/,
  )?.[0];
  assert.ok(helper, "the ACTIVE notification recovery helper must exist");
  assert.match(helper, /await reconcileCampaignStepOpenings\(/);
  assert.match(helper, /await notifyCampaignLaunch\(params\)/);

  const sameStatusBranch = route.match(
    /if \(nextStatus === ctx\.campaign\.status\)[\s\S]*?return NextResponse\.json\(\{ campaign \}\);/,
  )?.[0];
  assert.ok(sameStatusBranch, "the same-status branch must exist");
  assert.match(sameStatusBranch, /await reconcileActiveCampaignNotifications\(/);
  assert.match(sameStatusBranch, /CAMPAIGN_NOTIFICATION_PENDING/);

  assert.match(
    route,
    /else if \(transition\.outcome === "activated"\)[\s\S]*?await notifyCampaignLaunch\(/,
  );
  assert.match(
    route,
    /if \(notificationPending\)[\s\S]*?CAMPAIGN_NOTIFICATION_PENDING[\s\S]*?status: 503/,
  );
  assert.doesNotMatch(
    route,
    /\.then\(\(\{ handleCampaignLaunched \}\)/,
    "campaign launch notification must not be fire-and-forget",
  );
});
