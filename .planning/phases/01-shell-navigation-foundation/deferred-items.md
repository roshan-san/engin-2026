## Deferred Items

- `convex/test.helpers.ts:175` has an unused `t: TestConvex` parameter in `cyclePulseFor`, flagged by `biome lint` (`noUnusedFunctionParameters`, warning severity).
  status: open
  **What:** Pre-existing since the domain-grouping commits (`0f19230`, `d1a57e2`, `30ba2e5`), unrelated to plan 01-03's UI/token scope. Confirmed present at the plan's starting commit (`01ff827`) before any 01-03 changes. It is a warning, not an error, so it does not fail `pnpm check`. Out of scope for this plan per the executor's scope boundary (pre-existing issue in an unrelated file); left for whichever plan next touches `convex/test.helpers.ts` or `convex/work/cycles.ts` tests.
