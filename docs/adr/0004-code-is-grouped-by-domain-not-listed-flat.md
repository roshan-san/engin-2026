---
status: frontend half superseded by ADR 0006; the backend grouping still stands
---

# Code is grouped by domain, not listed flat

Both `src/features/` and `convex/` used to list one folder or file per feature/domain at a single flat level (12+ feature folders on the frontend; 14 domain files at the Convex root). As the codebase grew this became hard to scan at a glance. We regrouped both sides into six shared domain buckets — `people`, `teams`, `hiring`, `work`, `app`, `marketing` — so `features/<domain>/<feature>/` and `convex/<domain>/` mirror each other, at the cost of Convex's generated `api.*` surface gaining one more segment (e.g. `api.startups.*` became `api.teams.startups.*`) and every call site needing that rename.

## Consequences

- Each domain was moved in its own commit (frontend + matching backend files together), so the history bisects cleanly if one domain's rename breaks something.
- `convex/lib/` was already grouped by domain from an earlier refactor and was left as-is; only the root-level files that are directly exposed as `api.*` were nested.
- A handful of files stay at `convex/` root on purpose because Convex expects them there or they're cross-cutting infra, not domain logic: `schema.ts`, `http.ts`, `auth.ts`, `auth.config.ts`, `convex.config.ts`, `migrations.ts`, `notifications.ts` (the `notify()` helper is called by every domain).
