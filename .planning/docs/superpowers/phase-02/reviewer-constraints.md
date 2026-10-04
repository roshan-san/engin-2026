# Global constraints binding every Phase 2 plan (reviewer lens)

- The plan's frontmatter `must_haves` (truths, prohibitions, artifacts with exports, key_links patterns) and each task's `<acceptance_criteria>` are binding, verbatim — exact strings, names, index names, constant values, refusal messages.
- Project conventions (D:/codex/engin-2026/AGENTS.md): Convex queries use `withIndex` on indexes defined in schema.ts, never `.filter`; bounded reads (`.take`) in new code; every public function starts with `requireUserId`; notifications via notify/notifyFounders; tests use only the public `api.*` via `t.withIdentity`/helpers (t.run seeding is allowed where the plan says so).
- Frontend: routes are thin (createFileRoute + params + render a feature page); logic in hooks, markup in components; semantic Tailwind color tokens only, no arbitrary values, mobile-first; reuse shadcn primitives; no new libraries beyond those a plan names (only @dnd-kit/core@6.3.1, @dnd-kit/sortable@10.0.0, @dnd-kit/utilities@3.2.2 exact, plus shadcn collapsible/popover/select).
- Files under ~250 lines, one responsibility each; magic numbers in constants (frontend constants.ts, backend convex/lib/limits.ts); comments explain why only.
- Glossary terms from CONTEXT.md in code and UI copy (Pulse, Cycle, Founder, Member, Cycle Member, Board, Proof Link, Verified/Submitted Pulse, Trial Cycle, Participant).
- `convex/lib/work/kanbanRules.ts` and `convex/lib/work/rank.ts` must have zero imports (shared with src/). The UI must never retype a refusal string; it imports KANBAN_REFUSALS / kanbanMove.
- Generated files (src/routeTree.gen.ts, convex/_generated/**) are never hand-edited.
- Line-ending-only changes are noise, not findings.
