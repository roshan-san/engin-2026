## Conflict Detection Report

### BLOCKERS (0)

### WARNINGS (0)

### INFO (3)

[INFO] Auto-resolved: ADR-0006 supersedes the frontend half of ADR-0004
  Note: docs/adr/0004-code-is-grouped-by-domain-not-listed-flat.md carries its own status frontmatter ("frontend half superseded by ADR 0006; the backend grouping still stands"), and docs/adr/0006-frontend-is-a-shell-plus-domain-features.md states "This decision replaces the frontend half of ADR 0004." Both sources agree — no contradiction to resolve. decisions.md keeps ADR-0004 scoped to backend/API-surface grouping and ADR-0006 as the current frontend architecture.

[INFO] Locked-status override applied to all 6 synthesized ADRs
  Note: every classification JSON in D:/codex/engin-2026/.planning/intel/classifications/ recorded "locked": false for ADR-0001 through ADR-0006 (none of the source ADR files carry a literal "Status: Accepted"/"locked: true" marker). The synthesizer's task instructions state these 6 ADRs are LOCKED decisions already implemented in the codebase and cited in code comments as "ADR 000N". decisions.md records status: locked for all 6 ADRs on that basis, overriding the classifier field. No PRD/SPEC documents were present in this ingest, so requirements.md and constraints.md are empty — this is expected, not a conflict.

[INFO] Cross-ref cycle resolved since previous ingest run
  Note: the prior run blocked on a 2-node cycle (docs/adr/0002-score-counts-only-founder-confirmed-evidence.md ↔ docs/adr/0003-each-participant-gets-a-private-board.md). The user removed the back-reference from docs/adr/0003-each-participant-gets-a-private-board.md, and its re-classification now shows cross_refs: []. The current graph (0002 → 0003, 0006 → 0004, 0006 → 0005) is acyclic, so both ADR-0002 and ADR-0003 are now fully synthesized into decisions.md. Residually, ADR-0002's classification still lists its cross-ref as "docs/adr/0003-per-participant-boards.md", a filename that does not match the actual file docs/adr/0003-each-participant-gets-a-private-board.md — harmless for this ingest (the target is unambiguous from context and content), but worth correcting in the source doc or manifest if it recurs.
