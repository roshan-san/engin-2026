# Synthesis Summary

Entry point for downstream consumers (`gsd-roadmapper`). Read this first, then the per-type intel files below.

## Docs consumed

7 classified documents from `D:/codex/engin-2026/.planning/intel/classifications/`:
- ADR: 6 (`docs/adr/0001`–`0006`)
- DOC: 1 (`CONTEXT.md`)
- PRD: 0
- SPEC: 0

## Decisions (`decisions.md`)

All 6 ADRs synthesized as locked decisions:
- ADR-0001 — Trial Cycles are the only path into a team (besides Invites) — `docs/adr/0001-trial-cycles-are-the-only-path-into-a-team.md`
- ADR-0002 — Score counts only Founder-confirmed evidence — `docs/adr/0002-score-counts-only-founder-confirmed-evidence.md`
- ADR-0003 — Each Participant gets a private Board — `docs/adr/0003-each-participant-gets-a-private-board.md`
- ADR-0004 — Code is grouped by domain, not listed flat (backend grouping; frontend half ceded to ADR-0006) — `docs/adr/0004-code-is-grouped-by-domain-not-listed-flat.md`
- ADR-0005 — Startups pay; talent and visibility are never for sale — `docs/adr/0005-startups-pay-talent-and-visibility-are-never-for-sale.md`
- ADR-0006 — The frontend is a shell plus domain features, and URLs carry the Startup — `docs/adr/0006-frontend-is-a-shell-plus-domain-features.md`

Note: ADR-0002 and ADR-0003 were excluded in the previous ingest run due to a cross-ref cycle. That cycle has since been resolved (see Conflicts below) and both are now fully synthesized.

## Requirements (`requirements.md`)

0 requirements extracted — no PRD-classified documents in this ingest.

## Constraints (`constraints.md`)

0 constraints extracted — no SPEC-classified documents in this ingest.

## Context (`context.md`)

1 DOC synthesized — `CONTEXT.md`, the domain glossary. 6 topic sections: People, Startups and teams, Hiring, Work, Reputation, Plans (terms, definitions, and `_Avoid_` naming constraints preserved verbatim).

## Conflicts

- 0 blockers (previous run's ADR-0002 ↔ ADR-0003 cross-ref cycle was resolved by the user before this re-run)
- 0 competing variants
- 3 auto-resolved / informational (ADR-0006 supersedes ADR-0004's frontend half; locked-status override applied to all 6 synthesized ADRs; a stale cross-ref filename in ADR-0002's classification)

Full detail: `D:/codex/engin-2026/.planning/INGEST-CONFLICTS.md`

## Files

- `D:/codex/engin-2026/.planning/intel/decisions.md`
- `D:/codex/engin-2026/.planning/intel/requirements.md`
- `D:/codex/engin-2026/.planning/intel/constraints.md`
- `D:/codex/engin-2026/.planning/intel/context.md`
- `D:/codex/engin-2026/.planning/INGEST-CONFLICTS.md`

## Status

READY — no blockers, no competing variants. Safe to route to `gsd-roadmapper`.
