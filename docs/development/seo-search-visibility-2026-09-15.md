# SEO visibility follow-up — 2026-09-15

## Browser baseline

Google, Hungarian language and country, signed out, pws=0. Organic results only; ads and AI blocks excluded. These are spot checks, not Search Console average positions.

| Query | Observed result |
| --- | --- |
| csapatdiagnosztika ár | 1, /pricing |
| csapatdiagnosztika | 4, legacy /how-we-work |
| trita | 3, homepage; 5, /about |
| személyiségteszt magyarul | Not on first page |
| ingyenes személyiségteszt | Not on first page |
| csapatfejlesztés | Not on first page |

Google autocorrected “hatfaktoros személyiségmodell” to “ötfaktoros személyiségmodell”; no exact-query rank was established.

## Changes

- Descriptive homepage and team H1s; shorter team page title.
- Consistent personality-test/team-diagnostics wording in footer, social title and organization description.
- Public guest assessment intro renders in initial HTML. Its start button waits for local draft resolution; saved assessments continue through the existing flow.
- Guest assessment uses the shared metadata builder, including social image and locale.
- Marketing sitemap review date updated after content changes.

## After production deployment

1. In Google Search Console URL Inspection, inspect /, /try, /team-dynamics and /pricing. Check the selected canonical, indexability and rendered page; request indexing for changed pages.
2. Check that /how-we-work still permanently redirects to /team-dynamics and /self-awareness to /. Keep these redirects; the browser audit verified HTTP 308 for both.
3. Confirm sitemap.xml is submitted. Monitor indexing of /team-dynamics and replacement of the old /how-we-work search snippet. Code cannot force Google's snippet or recrawl timing.
4. Compare Hungarian query/page performance over comparable 28-day windows: impressions, clicks, CTR and average position, separately for brand, personality tests and team diagnostics.

No Search Console changes or deployment were performed as part of this branch. Ranking gains are not guaranteed by these changes.
