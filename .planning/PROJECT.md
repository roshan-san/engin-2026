# Engin

## What This Is

Engin is a web platform (Vite/React SPA + Convex backend) where people join startups by proving
themselves in time-boxed, real-work Trial Cycles instead of applying cold, and build a public
Score from Founder-verified work. Startups run internal Cycles of Pulses on a kanban; Founders
post Roles that are filled only through Trial Cycles (or a direct Invite) ending in a Verdict and,
sometimes, an Offer. It targets solo/small founding teams, initially going to market at colleges
and incubators in India.

This milestone is a brownfield redesign: a Linear-style rebuild of the whole signed-in frontend,
finishing the Trial Cycle feature set to match the CONTEXT.md glossary, and moving billing from a
per-user to a per-Startup Plan with India-ready checkout.

## Core Value

People join startups by proving themselves in time-boxed, real-work Trial Cycles, and build a
public reputation (Score) from verified work.

## Business Context

- **Customer**: Startup Founders (the Startup pays); talent (Contributors/Participants) always uses Engin for free.
- **Revenue model**: Flat Pro subscription per Startup ($10/month or yearly equivalent, priced in the payer's local currency), sold on higher Trial Cycle Capacity, open Roles, live Trial Cycles, Members and Stealth — never on talent visibility (ADR-0005).
- **Success metric**: Startups complete real hiring loops (Role → Trial Cycle → Verdict → accepted Offer) inside the redesigned app, and a growing share of active Startups upgrade to Pro through the new local-currency/UPI checkout. (derived from #19 — confirm)
- **Strategy notes**: Go-to-market is campus and incubator events in India; Dodo discount codes (expiry + usage limit) are the promo mechanism, set up manually in the Dodo dashboard.

## Requirements

### Validated

<!-- Shipped and confirmed working in the current (pre-redesign) codebase. -->

- ✓ Google sign-in via `@convex-dev/auth`, no onboarding — shipped
- ✓ Startups, Founders/Members, memberships, and a base Invite backend (email + token) — shipped, extended in this milestone (TEAM-01)
- ✓ Pulse model: 4 kanban states (`todo`/`in_progress`/`review`/`done`), typed Proof Links, every Pulse belongs to a Cycle — shipped (issue #3)
- ✓ Cycle Members and Cycle-scoped visibility (Members see only their Cycles; Founders see all) — shipped (issue #5)
- ✓ Internal kanban with a Founder-only review→done gate and drag-and-drop — shipped (issue #6)
- ✓ Score derived only from Trial Cycle outcomes (passed Verdict +80, accepted Offer +120, Leaving −40, floor 0); Proof of Work on profiles — shipped (issue #7, ADR-0002)
- ✓ Private per-Participant Trial Boards seeded from the Founder's Challenges — shipped (issue #8, ADR-0003)
- ✓ Private per-Participant Threads plus one-way Announcements, replacing the old shared trial chat — shipped (issue #10)
- ✓ Append-only Activity record and Startup dashboard feed — shipped (issue #11)
- ✓ Public Pitch page with an editor and a public/signed-in split — shipped (issue #12)
- ✓ Explore contributors tab with base filters/sorts — shipped (issue #13)
- ✓ Cycle lifecycle: auto-start, close-with-carry-over, member removal — shipped (issue #14)
- ✓ Roles, Trial Cycles (open/application Admission), Applications, Offers, and an all-at-once Verdict close — shipped pre-existing, superseded by this milestone's Phase 4
- ✓ Per-user Dodo Payments billing (Pro tier on `users.planTier`) — shipped pre-existing, superseded by this milestone's Phase 6 (Plan moves to the Startup, ADR-0005)

### Active

<!-- This milestone's scope, sourced from GitHub issue #19 (primary spec) and the open slices of #2. See REQUIREMENTS.md for the full, ID-level breakdown and ROADMAP.md for phase mapping. -->

- [ ] Rebuild the signed-in frontend as a Linear-style shell: sidebar, Startup switcher, command palette, keyboard shortcuts, `/s/$slug` routing, dark-only theme (ADR-0006)
- [ ] Redesign My Pulses (home screen) and Cycle Board/List views with a drag-and-drop kanban and a peek panel
- [ ] Build the Inbox (notifications/Offers/Invites answered in place), finish Invites by username/email with co-Founders, rebuild the Team/Pitch/Activity screens, add Pitch media and Public Stats
- [ ] Complete Trial Cycles: Challenges (incl. mid-trial), Submissions, per-Participant Verdicts with a `J`/`K` review screen, Announcements and Threads surfaced in the new shell
- [ ] Merge Explore and Opportunities into one public Discover page (Trial Cycles / Startups / Contributors tabs) with filters
- [ ] Move the Plan from User to Startup, enforce shared limits, rework checkout for local currency/UPI/discount codes, rebuild the landing and pricing pages, add Playwright coverage for the critical flows

### Out of Scope

<!-- From #19's and #2's own "Out of Scope" sections. Included so re-proposals get a quick "already decided" answer. -->

- Paid visibility of any kind (promoted listings, featured placement, Pro-only outreach) — ADR-0005 rules out selling talent visibility
- Free Pro trials or a "first Trial Cycle at Pro limits" mechanic — Free is kept simple
- In-app discount/coupon handling beyond the checkout field — codes are created in the Dodo dashboard and handed out in person
- A light theme or theme toggle — dark-only by design
- Team-based or hackathon-scale Trial Cycles, leaderboards, prizes — Trial Cycles stay small, individual and private (ADR-0003); "Unstop-style" applies only to how Discover looks
- Handing billing over between Founders — the subscription stays with whoever paid
- Two-key "go to" shortcut chords (e.g. `G` then `I`)
- Component-level UI tests — only Playwright end-to-end coverage on critical flows
- In-app outreach or direct messaging from Founders to Contributors — share a Trial Cycle link or send a team Invite instead
- Sending emails of any kind
- Standalone hackathon-style Trial Cycles without a Role
- A `blocked` Pulse state, Pulses outside a Cycle, or group chat in Trial Cycles — superseded by the shipped Pulse/Board model

### v2 Candidates (deferred, not rejected)

- Pitch analytics (views, follower trends)
- College/graduation-year profile fields and school/work verification via SheerID
- Investor accounts, investor-only Pitch views, fundraising features
- GitHub integration (auto-linking PRs/commits to Pulses) and GitHub verification
- Startup verification, reporting, moderation and anti-gaming beyond Founder verification
- Counting internal Verified Pulses toward Score (revisit once Startup verification exists)
- A success fee per accepted Offer
- A talent-side paid plan
- Native mobile apps

## Context

- Brownfield project. See `.planning/codebase/` for the mapped current architecture (last mapped at
  commit `63da4c3`, 2026-09-28) and `docs/adr/0001`–`0006` for locked decisions.
- No PRD/SPEC files exist in the repo; this milestone's scope was sourced directly from GitHub
  issues via `gh issue view` at the user's direction: issue #19 (primary, newest, ~39k chars) plus
  the open child slices of parent spec #2 (#4, #9, #15, #16, #17, #18). Issue #1 is reference only
  — all of its slices are already shipped.
- **ADR-0006 is locked but not yet implemented.** The mapped codebase still has `/app/*` routes,
  `src/features/app/` as the shell, `ui/` folders and separate Explore/Opportunities pages — none
  of `src/shell/`, `/s/$slug` routing or the merged `/discover` page exist yet. This milestone is
  what implements ADR-0006, not a milestone that assumes it's already done.
- Issue #19 is explicitly the newer, overlapping-superseding spec versus #2's open slices: where
  both touch the same ground (Trial Submission/Verdict timing vs. per-Participant Verdicts;
  Explore/Opportunities vs. Discover), #19's version is what's built, with both issues cited on the
  merged requirement.
- Solo founder in India, building with Claude as the implementer; prefers simple mechanics and
  "build only what V1 needs" (CLAUDE.md).

## Constraints

- **Locked architecture decisions (ADR 0001–0006)**: no phase may contradict them.
  - ADR-0001 — Trial Cycles (or a Founder Invite) are the only path onto a team; no direct Role applications.
  - ADR-0002 (amended 2026-09-26) — Score counts only Founder-confirmed evidence: passed Verdict +80, accepted Offer +120, Leaving −40 (floor 0). No per-Pulse Score. Internal Verified Pulses are Proof of Work only.
  - ADR-0003 — Each Participant gets a private Board seeded from Challenges, a private Thread with the Founders, and one-way Announcements — never a shared board or group chat.
  - ADR-0004 — Backend code is grouped by domain (`convex/{people,teams,hiring,work}/`, `convex/lib/<domain>/`); its frontend half is superseded by ADR-0006.
  - ADR-0005 — The Plan belongs to the Startup, not the User; talent features are free and unlimited; nobody can pay for visibility or contact.
  - ADR-0006 — Frontend is `src/shell/` (app frame) + `src/features/<domain>/<feature>/pages/` (backend-mirrored domains) + frontend-only `discover`/`marketing`; URLs carry the Startup (`/s/$slug/...`); no `/app` prefix; dark-only.
- **Tech stack**: pnpm; Vite + React 19 + TanStack Router (file-based); Convex (DB/functions/auth/scheduler); Tailwind v4 with semantic tokens only, mobile-first; shadcn/ui (new-york, lucide icons); zod; Biome (tabs, double quotes). `pnpm check` (lint+format+typecheck) is the quality gate.
- **New libraries this milestone explicitly allows**: dnd-kit (kanban drag-and-drop, replacing the hand-rolled pointer drag), a variable-font package, Playwright (dev dependency, e2e only). No form library, no animation library, no other additions without explicit approval.
- **Domain language**: use CONTEXT.md terms in code, UI and requirements; avoid the synonyms it lists under "_Avoid_" (e.g. Cycle not Sprint, Pulse not Task/Ticket, Capacity not Seats/Slots, Discover not Explore/Opportunities, Thread not Chat room, Plan not Subscription tier).
- **Convention**: files stay under ~250 lines with one responsibility; pages thin (logic in hooks, markup in components); magic numbers live in `constants.ts` (frontend) / `lib/limits.ts` (backend); every `ctx.db.query()` uses `.withIndex()`.
- **No production users yet** — migrations for this milestone's schema changes (Plan → Startup, field renames) can be lossy where the spec says so (e.g. unattributable trial messages dropped).
- **No dedicated CI pipeline detected** — `pnpm check` and `pnpm test` are run locally before considering work done.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scope this milestone from GitHub issues, not PRD files | Repo has no PRD/SPEC docs; issues #19 and #2's open slices are the only source of committed-but-unbuilt scope | ✓ Good — issues are detailed enough to act as specs |
| Issue #19 wins over overlapping #2 slices | #19 is the newer, more complete spec (per user); merging avoids duplicate/contradictory requirements | ✓ Good |
| Treat ADR-0001–0006 as locked, including ADR-0006 (not yet implemented) | ADRs document already-decided direction; ADR-0006 is this milestone's actual shell work, not prior art to preserve | ✓ Good — confirmed against mapped codebase, which predates the redesign |
| Phase order follows #19's own build order (shell → domain slices → billing) | The spec's authors already reasoned through the dependency chain; app-shell must exist before the screens that live in it | — Pending (validate once Phase 1 ships) |
| Fold Playwright e2e tests into the final phase rather than a standalone phase | The 5 required flows each span every domain slice; they can't be written until all of them exist | — Pending |

---
*Last updated: 2026-09-28 after initial roadmap creation (new-project-from-ingest)*
