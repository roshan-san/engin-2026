# Engin

## What This Is

Engin is the online hiring hackathon for early-stage Indian startups. A founder publishes a Trial Cycle, and contributors (often students from college E-cells) each get a private board seeded with the founder's challenges. They ship real work and get a verdict; the winner gets an offer. The result lands on the contributor's public Score. Startups also run internal work Cycles of Pulses after the hire.

This milestone replaces the stub screens left by the Linear-style shell redesign with working screens on the already-built Convex backend, starting with the paid hackathon flow.

## Core Value

A founder can create, pay for, publish and run a hiring hackathon end to end in the app, and a contributor can find it, enter, ship and get a verdict that shows on their Score.

## Business Context

- **Customer**: founders of pre-seed Indian startups hiring 1 builder. Contributors are always free; incubators and E-cells are a marketing channel, not users.
- **Revenue model**: ₹2,999 per hackathon on Free; Pro ₹999/mo or ₹9,999/yr includes 1 hackathon credit a month (max 3 banked) and ₹1,499 extra hackathons. Launch codes for free runs (≤10 per 90 days).
- **Success metric**: within 90 days, 10 hackathons by 10 founders, ≥3 accepted offers, ≥3 paying founders, ≥5 participants per hackathon on average; Engin hires its own next builder through one.
- **Strategy notes**: `.planning/docs/designs/engin-hiring-hackathon.md` (approved), `engin-hiring-hackathon-eng-review.md`, `engin-hiring-hackathon-test-plan.md`.

## Requirements

### Validated

<!-- Shipped and confirmed in the current codebase. -->

- ✓ Google sign-in (`@convex-dev/auth`) — existing
- ✓ Linear-style shell: sidebar, Startup switcher, mobile bars, ⌘K palette, shortcut registry, `/s/$slug` routing, dark-only theme — existing (previous milestone, Phase 1)
- ✓ Public pages in the shell: Pitch, profile, Discover, Invite — existing
- ✓ Backend for Cycles and Pulses: lifecycle, Cycle Members, boards, proof links, founder verify/reject — existing (`convex/work/`)
- ✓ Backend for Startups, members, invitations, follows, activity feed, Explore — existing (`convex/teams/`)
- ✓ Backend for hiring: Roles, Trial Cycles, applications/joins, challenges, threads + announcements, verdicts, offers, opportunities — existing (`convex/hiring/`)
- ✓ Hiring hackathon backend: credits ledger, launch/UPI codes, draft → publish gate, reschedule, re-run credits, Dodo INR checkout + webhooks, monthly Pro credits cron — existing (`convex/billing/`, `lib/hiring/publish.ts`)
- ✓ Entry rules: IP acknowledgment, no self-entry, 5 live entries, Score integrity, issuing startup on verdicts — existing
- ✓ Notifications backend (list, mark read) — existing

### Active

<!-- This milestone. Hypotheses until shipped. -->

- [ ] Founder hiring screen: Roles, draft Trial Cycles, publish with credit balance, launch-code claim, Dodo checkout, reschedule
- [ ] Public hackathon page and Discover listing: deadline, challenges, participant count, role, prize, IP notice, apply/join with IP tick
- [ ] Pricing page rewritten for the Free vs Pro + per-hackathon pricing
- [ ] Trial Cycle run screen: challenges (incl. mid-trial), participant boards, threads and announcements, verdicts, offers, cancel/close
- [ ] Profile screen showing Score, proof of work and verdicts with issuing startup
- [ ] Cycles list, Cycle board (drag-and-drop) and My Pulses home on the existing work backend
- [ ] Team, Settings, Pitch editor, Activity, Inbox and Threads screens replacing their stubs

### Out of Scope

- Moving the Plan to the Startup (old ADR-0005) — superseded by the approved hackathon design: Pro and credits belong to the founder's user account
- J/K verdict review screen, `C` quick-create chord, URL-addressable peek panel polish beyond what's needed — functional first
- Playwright / frontend tests — CLAUDE.md: only `convex/**/*.test.ts` is tested
- Investor features, auto investor updates — frozen until 25 startups have each run a real Cycle
- Equity kit — legal complexity; next build after the first real hire
- Paid visibility or paid contact of any kind — founders pay to hire, never to reach talent
- Prize handling in-app — prize is free text, paid off-platform
- Light theme — dark-only
- Sending emails
- Incubator/E-cell dashboards, college placement dashboards — channel only / deferred revenue line

## Context

- Brownfield. React 19 + Vite + TanStack Router SPA on Convex; see the repo `CLAUDE.md` for architecture, guard pattern and conventions.
- A previous GSD milestone shipped the shell (Phase 1) and left `StubScreen` on: hiring, `TrialCyclePage`, profile, pitch, cycles, cycle detail, my-pulses, team, settings, activity, inbox, threads. The old `.planning/` was deleted on 2026-09-29; this is a fresh start that reuses its context, not its files.
- Existing frontend pieces to reuse: `src/features/hiring/trialCycles/components/*` (applicants, challenges, threads, verdict, close form), `src/features/work/{cycles,pulses}/components`, `src/features/teams/team`, `src/features/people/profile`, `src/features/discover`, `src/features/marketing/{landing,pricing}`.
- `src/features/hiring/trialCycles/constants.ts` already has `CONTRIBUTOR_IP_TERMS` and `confirmIpTerms`.
- Dodo products (Pro monthly/yearly, Hackathon ₹2,999, Hackathon-for-Pro ₹1,499) must be created by hand in the Dodo dashboard and set as Convex env vars.
- Solo technical founder in India building with Claude as implementer; prefers the simplest mechanic.

## Constraints

- **Tech stack**: pnpm, Vite + React 19 + TanStack Router (file-based), Convex, Tailwind v4 semantic tokens, shadcn/ui, Biome (tabs, double quotes). No new libraries without approval (dnd-kit allowed for the kanban).
- **Frontend layout**: route files stay thin and render pages from `src/features/<domain>/<area>/{pages,components,hooks,constants,schemas}`; Convex `useQuery`/`useMutation` live in feature hooks, passing `"skip"` when args aren't ready.
- **Backend changes**: only where a screen needs a missing query/mutation; follow the guard pattern, bounded reads (`lib/limits.ts`), tests next to the module.
- **Quality gate**: `pnpm check` and `pnpm test` pass before a phase is done.
- **Mobile**: every screen works at phone width (go-to-market is in person at colleges).
- **Pricing is INR**; contributors never pay.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bring back GSD `.planning/` for this milestone | User chose it on 2026-10-01 over a single docs/plans file | — Pending |
| Scope = every stubbed screen | User wants the whole app usable, not only the hackathon path | — Pending |
| Money path first: hiring/publish/checkout → trial run + profile → work → team/inbox | 90-day goal is paid hackathons; Engin's own hackathon needs steps 1–2 | — Pending |
| Functional first, light polish | Keep drag-and-drop; drop J/K review, chords, Playwright | — Pending |
| Hackathon design beats old ADR-0005 | Pro + credits per founder user is what the shipped backend does | — Pending |
| Skip codebase mapping | Repo CLAUDE.md documents the architecture; GSD agents aren't installed | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-01 after initialization*
