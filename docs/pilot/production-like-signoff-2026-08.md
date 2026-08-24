# Production-like pilot sign-off

This record is intentionally fail-closed. Real participants must not be invited
until every checkbox has an owner, timestamp and evidence link. Never paste
secrets or personal data into this file.

## Technical gate

- [ ] `pnpm pilot:preflight` passes in the production environment.
- [ ] Checks, Unit, Integration, Client, E2E and Pilot Gate are green on the release commit.
- [ ] `https://trita.io`, sign-in callbacks and invite links return the expected HTTPS response.
- [ ] Preview uses a separate database and cannot send external email, newsletters or cron work.
- [ ] Clerk live callbacks, Resend domain/webhook, Upstash, cron secret and CSP smoke tests pass.
- [ ] A synthetic send failure reaches the error-alert channel and a retry succeeds.

## End-to-end dry run

- [ ] lead → organization/team → bulk invite → Self → Trust → Pulse completed with at least 3 test participants.
- [ ] Resume from a partial draft, duplicate submit and provider-failure retry were exercised.
- [ ] One-way Trust edges and sub-threshold labels are absent from API, UI, report and export.
- [ ] Report draft → publish → action/evidence → follow-up comparison completed.
- [ ] No participant is stranded on a completed step; all data is scoped to the intended campaign/team.

## Sign-off

Release commit: `____________________`  Environment: `____________________`

Technical owner / date / evidence: `________________________________________`

Pilot owner / date / evidence: `____________________________________________`

Decision: `NO-GO` until both signatures and all evidence are present.
