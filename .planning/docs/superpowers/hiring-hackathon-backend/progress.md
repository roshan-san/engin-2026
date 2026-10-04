# SDD ledger — plan: docs/plans/2026-09-30-hiring-hackathon-backend.md

Worktree: D:\codex\engin-2026\.claude\worktrees\hiring-hackathon-backend, branch worktree-hiring-hackathon-backend, from ccada1d.
Baseline: 19 files / 133 tests passing.
Spec: docs/designs/engin-hiring-hackathon.md (+ -eng-review.md, -test-plan.md) — reachable.

## Preflight scan

| Pair / task | Produces vs consumes | Finding |
|---|---|---|
| T1 → T2 | creditSource above trialStatus (schema L76); listSpendableCredits, CreditSource | consistent |
| T1 → T4/T5 | credits.test.ts imports extended; balanceOf helper | consistent |
| T2 → T4,T5,T6,T7 | setUpStartup returns t; createTrial publishes; createDraftTrial, giveCredit | consistent (T6 perl adds acceptTerms to applyWith in T4 test + startedTrialWith) |
| T2 → T5 | publishProblem/publishDraft/requirePublishable, IP_TERMS_MESSAGE | consistent |
| T3 vs T2 | T3 removes liveTrialCycles; T2 relies on createTrial staying `open` for startups.test counts | consistent (liveTrialCycles is display-only, not enforced in create) |
| T4 → T5 | grantCredit | consistent |
| T5 vs http.ts | T5 deletes setPlanTier; only caller is http.ts, rewritten in same task | consistent |
| T6 vs T1-T5 tests | T6 adds required acceptTerms; earlier tests call joinTrial/applyToTrial without it | handled by T6 Step 1 perl sweep |
| T6 → T7 | applications.ipAcknowledgedAt; scoreExcluded goes after it | consistent ordering |
| T8 vs worktree | CLAUDE.md is gitignored, absent from worktree | see Ruling 2 |
| T1 self | 5 tests / code agree; budget test relies on _creationTime from fake clock — plan gives fallback | ok |
| T2 self | trialCycles.test already imports vi, advancePast, HOUR, TestConvex; `compensation` appears in roles (L274) and trialCycles (L304) — use trialCycles | ok (ambiguity noted to implementer) |
| T3 self | four test lines at 292/298/352/387 confirmed | ok |
| T4 self | 6 tests vs grantRerunCredit messages agree | ok |
| T5 self | 13 tests vs webhook code agree; notify(kind "billing") exists; users "email" index exists; getPlan uses planTier | ok |
| T6 self | entries.ts already imports getTrialApplication; src callers = ApplyButtons.tsx, ParticipantTrialActions.tsx only | ok |
| T7 self | offers.accept tolerates existing membership; signUp usernames lowercase; startup "Acme" | ok |

Ruling: Plan's R1 deviation (Pro grant key pro_monthly:{userId}:{YYYY-MM} + daily cron, instead of (subscriptionId, periodStart)) accepted as written — yearly plans would otherwise get 1 credit/year — if wrong, only the grant key and cron change.
Ruling: Task 8 Step 4 (CLAUDE.md, gitignored, lives only in main checkout) is applied at finish to D:\codex\engin-2026\CLAUDE.md, not in the worktree — a worktree copy would be lost — if wrong, the user re-pastes two bullets.
Ruling: .env.local copied from the main checkout into the worktree so `convex codegen` can run — codegen only reads the deployment; nothing is pushed — if wrong, delete the worktree copy.

## Tasks
