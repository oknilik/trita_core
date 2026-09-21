/** Pilot policies, not empirically validated psychometric thresholds. */
export const POLICY = {
  minRespondents: 3,
  minItemsPerAxis: 5,
  minItemsPerPole: 2,
  minCoverage: 0.6,
  neutralHalfWidth: 6.25,
  disagreementSd: 25,
} as const;
