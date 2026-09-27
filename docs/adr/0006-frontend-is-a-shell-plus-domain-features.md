# The frontend is a shell plus domain features, and URLs carry the Startup

This decision replaces the frontend half of ADR 0004. The frontend was redesigned Linear-style:
- a sidebar, with a bottom tab bar on mobile
- one Focused Startup chosen with a switcher, plus personal areas (Inbox, My Pulses, Threads) that span every Startup
- ⌘K and a few single-key shortcuts
- dark only

To support that, the code is split into three parts:
- **`src/shell/`** is the app frame: sidebar, mobile tabs, switcher, command palette, shortcuts, layouts. It is not a feature and has no backend counterpart.
- **`src/features/<domain>/<feature>/`** holds the four backend domains (`people`, `teams`, `hiring`, `work`). They keep mirroring `convex/<domain>/`.
- **`discover` and `marketing`** are frontend-only surfaces that compose cards from those domains.

Inside a feature, page components live in `pages/` (formerly `ui/`, which read like primitives), next to `components/`, `hooks/`, `schemas/` and `constants.ts`.

The Focused Startup is carried in the URL (`/s/$slug/...`) rather than in hidden server state. That gives every screen and every notification link a stable, shareable address. `users.activeStartupId` survives only as "last focused", so `/` and the switcher know where to send you. There is no `/app` prefix anymore: the root layout picks the app shell or the public header based on sign-in state, so a signed-in Member sees `/startup/$slug`, `/u/$username` and `/discover` inside the sidebar.

## Consequences

- Explore and Opportunities merge into one public `/discover` page with three tabs: Trial Cycles, Startups and Contributors.
- Backend files move to match the domain model:
  - `people/billing.ts` → `teams/billing.ts`, because the Plan is the Startup's (ADR 0005)
  - `hiring/trialMessages.ts` → `hiring/threads.ts`
  - `trialCycles.maxContributors` → `capacity`
- Libraries added on purpose:
  - dnd-kit for the kanban, replacing the hand-rolled pointer drag
  - shadcn primitives as needed (sidebar, command, sheet, dialog, tabs, tooltip, …)
