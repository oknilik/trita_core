import { expect, test } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";

const GATE_PATH = "/pilot-release-gate";
const GATE_CTA_ID = "pilot_release_gate";

test("client analytics event is persisted in the isolated database", async ({ request }) => {
  await prisma.analyticsEvent.deleteMany({
    where: { name: "cta.click", path: GATE_PATH },
  });

  try {
    const response = await request.post("/api/e", {
      headers: {
        // A mérés helyesen szűri a HeadlessChrome UA-t. A smoke teszt egy
        // normál böngésző kérését modellezi, hogy az írási útvonalat mérje.
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",
        referer: "http://127.0.0.1:4199/pilot-release-gate",
      },
      data: {
        events: [
          {
            name: "cta.click",
            path: GATE_PATH,
            props: { cta_id: GATE_CTA_ID, surface: "pilot" },
          },
        ],
      },
    });

    expect(response.status()).toBe(204);
    await expect
      .poll(
        () =>
          prisma.analyticsEvent.count({
            where: { name: "cta.click", origin: "client", path: GATE_PATH },
          }),
        { timeout: 15_000 },
      )
      .toBe(1);
  } finally {
    await prisma.analyticsEvent.deleteMany({
      where: { name: "cta.click", path: GATE_PATH },
    });
  }
});
