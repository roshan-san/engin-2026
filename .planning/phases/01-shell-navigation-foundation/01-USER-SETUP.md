# Phase 01: User Setup Required

**Generated:** 2026-09-28
**Phase:** 01-shell-navigation-foundation
**Status:** Incomplete

Complete this item before the next `pnpm dev:backend`. Claude automated everything else in plan 01-01 (the schema rename itself, and every call site that reads or writes the field).

## Dashboard Configuration

- [ ] **Clear the old Focused-Startup field from every `users` document (or reset dev data)**
  - Location: Convex dashboard → Data → `users`
  - Why: Plan 01-01 (D-13) renamed `users.activeStartupId` to `users.focusedStartupId` as a plain schema rename with no migration (no production users exist yet). `pnpm dev:backend` (`convex dev`) will refuse to push the new schema while any dev `users` document still holds the old `activeStartupId` field, because that field no longer exists in `convex/schema.ts`.
  - Options: either delete the `activeStartupId` field from each existing `users` document in the dev deployment, or reset the dev deployment's data entirely if you don't need to keep existing dev records.

## Verification

After completing setup:

```bash
pnpm dev:backend
```

Expected: `convex dev` pushes the new schema without a validation error about `activeStartupId`.

---

**Once complete:** Mark status as "Complete" at top of file.
