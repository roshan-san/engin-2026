# Engin

## What This Is

Engin is the online hiring hackathon for early-stage Indian startups. A founder publishes a Trial Cycle; each contributor (often a student from a college E-cell) gets a private board seeded with the founder's challenges, ships real work and gets a verdict, and the winner gets an offer. Every verdict lands on the contributor's public Score with the startup that issued it. After the hire, startups run internal work in Cycles of Pulses.

This milestone replaces the stub screens with working screens on the Convex backend, which is already built. The paid hackathon flow comes first.

## Core Value

A founder can create, pay for, publish and run a hiring hackathon in the app, and a contributor can find it, enter, ship and get a verdict that shows on their Score.

## Business Context

- **Customer**: founders of pre-seed Indian startups hiring one builder, often for equity. Contributors are always free. Incubators and E-cells are a marketing channel, not users.
- **Revenue model**: Every new account gets its first hackathon free (a signup credit). After that ₹2,999 per hackathon on Free, ₹1,499 on Pro. Pro is ₹999/mo or ₹9,999/yr and is a workspace plan (bigger limits, stealth) with no included hackathon credits. Discount codes live in Dodo, not the app.
- **Success metric (90 days)**: Engin hires its own next builder through a hackathon; 10 hackathons by 10 other founders; ≥3 accepted offers; ≥3 paying founders; ≥5 participants per hackathon on average.
- **Edge**: competitive and many-to-one, graded on real Pulses, feeding a public Score that names the issuer. Closest competitor is Joinstartup (paid trials from ₹10k).

## Requirements

### Validated

- ✓ Google sign-in (`@convex-dev/auth`): existing
- ✓ App shell: sidebar, Startup switcher, mobile bars, ⌘K palette, shortcut registry, `/s/$slug` routing, dark-only theme: existing
- ✓ Public pages: Pitch, profile, Discover, Invite: existing
- ✓ Work backend: Cycles, Cycle Members, Pulses, boards, proof links, founder verify/return (`convex/work/`): existing
- ✓ Teams backend: Startups, members, invitations, activity, Explore (`convex/teams/`): existing
- ✓ Hiring backend: Roles, Trial Cycles, applications/joins, challenges, threads and announcements, verdicts, offers, opportunities (`convex/hiring/`): existing
- ✓ Billing backend: `hackathonCredits` ledger, launch/UPI codes, draft → publish gate, reschedule, re-run credits, Dodo INR checkout and webhooks, monthly Pro credit cron (`convex/billing/`, `convex/hiring/publish.rules.ts`): existing
- ✓ Entry rules: IP acknowledgment, no self-entry, 5 live entries, Score integrity, issuing startup on verdicts: existing
- ✓ Notifications backend (list, mark read): existing

### Active

- [ ] Founder Hiring screen: Roles, draft Trial Cycles, credit balance, code claim, publish, Dodo checkout, reschedule
- [ ] Public hackathon page and Discover listing; apply/join with the IP tick; my entries
- [ ] Pricing and landing pages rewritten for INR Free vs Pro and per-hackathon pricing
- [ ] Trial Cycle run screen: applicants, challenges, participant boards, threads, announcements, verdicts, offers
- [ ] Profile with Score, proof of work and verdicts naming the issuing startup
- [ ] Cycles list, drag-and-drop Cycle board, My Pulses home
- [ ] Team, Settings, Pitch editor, Activity, Inbox and Threads screens

### Out of Scope

- Plan or credits on the Startup: Pro and credits belong to the founder's user account, which is how the backend works
- Investor features and auto investor updates: frozen until 25 startups have each run a real Cycle
- Equity kit: legal complexity, so it waits until after the first real hire
- Paid visibility or paid contact: founders pay to hire, never to reach talent
- In-app prize payouts: the prize is free text and is paid off-platform
- Leaderboards, stars, likes, streaks, participation points in Score: Score is founder-verified outcomes only
- Frontend tests: the repo tests only `convex/**/*.test.ts`
- Light theme, emails, incubator/E-cell dashboards

## Context

### Product rules (built into the backend; the UI must surface them, not re-implement them)

- **Charge point is publish.** `trialCycles.create` inserts a `draft`. Drafts are hidden from Discover, opportunities and entry, and nothing is scheduled for them. `publish` is one mutation that runs these checks in order: founder, status is draft, startup not in stealth, Role open, `applicationDeadline ?? startsAt` still in the future, IP tick. It then spends exactly one credit, opens the Trial Cycle and schedules its start. Mutations are serializable, so a double click can't spend twice.
- **Credits** are owned by the founder who paid or got them and can be spent on any startup they found. Sources are `signup` (1 per new account, no expiry), `purchase` and `rerun`; spending skips expired credits. There are no launch/UPI codes and no monthly Pro credits. Cancelling an open hackathon before it starts returns its credit.
- **One-time payment**: the Dodo `payment.succeeded` webhook grants a `purchase` credit keyed by payment id, then auto-publishes the draft if its dates are still valid. Otherwise the credit stays in the balance and the draft needs new dates (`NEW_DATES_MESSAGE`). A payment with no matching user is logged with `console.error` and fixed by hand.
- **Re-runs**: if a hackathon gets fewer than 3 applications by its entry cutoff, Engin grants one re-run credit by hand (`grantRerunCredit`). It expires after 60 days and a re-run can't earn another one.
- **Stealth**: a stealth startup can't publish, so every hackathon and verdict names the real startup.
- **IP**: contributors keep ownership of their submissions. A founder may use a submission only from someone whose offer was accepted, or by paying separately. Both sides tick an acknowledgment, stored with a timestamp.
- **Entry**: at most 5 live entries per contributor, with no Pro bypass. Founders and members can't enter their own startup's hackathon. Anyone who joins the startup mid-trial gets a verdict with no Score change. Caps: 10 participants, 50 applications.

### Codebase

- Brownfield. React 19 + Vite + TanStack Router SPA on Convex. The repo `CLAUDE.md` covers architecture, guards, file naming and test helpers.
- Stubbed screens (`StubScreen`): hiring, `TrialCyclePage`, profile, pitch, cycles, cycle detail, my-pulses, team, settings, activity, inbox, threads.
- Frontend pieces to reuse: `src/features/hiring/trialCycles/components/*` (applicants, challenges, threads, verdict, close form) and its `constants.ts` (`CONTRIBUTOR_IP_TERMS`), plus `src/features/work/{cycles,pulses}/components`, `src/features/teams/team`, `src/features/people/profile`, `src/features/discover` and `src/features/marketing/{landing,pricing}`.
- Dodo products (Pro monthly/yearly, Hackathon ₹2,999, Hackathon-for-Pro ₹1,499) are created by hand in the Dodo dashboard and set as Convex env vars.

### Open questions (answer with real hackathons, not code)

- Will contributors do unpaid 3–7 day hackathons for equity roles, and does a prize change turnout?
- Are ₹999/mo and ₹2,999 right? If fewer than 2 of the first 5 founders commit, try ₹499/mo and ₹1,999.
- Best hackathon length: 3, 5 or 7 days?
- Should the 10-participant cap rise? Decide from the first hackathon's application-to-join ratio.

## Constraints

- **Tech stack**: pnpm, Vite + React 19 + TanStack Router, Convex, Tailwind v4 semantic tokens, shadcn/ui, Biome. No new libraries without approval, except dnd-kit for the kanban.
- **Frontend layout**: thin route files render pages from `src/features/<domain>/<area>/{pages,components,hooks,constants,schemas}`. `useQuery`/`useMutation` calls live in feature hooks and pass `"skip"` until args are ready.
- **Backend changes**: only when a screen needs a missing query or mutation. Follow the guard pattern and bounded reads, and put tests next to the module.
- **Errors**: backend guards throw user-facing messages, and the UI shows them word for word, adding only the action that fixes the problem.
- **Quality gate**: `pnpm check` and `pnpm test` pass before a phase is done.
- **Mobile**: every screen works at phone width, because go-to-market happens in person at colleges.
- **Money**: prices in INR. Contributors never pay.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Money path first: hiring/publish → entry → trial run → profile, then work and team screens | The 90-day goal is paid hackathons, and Engin's own hackathon needs the first four | — Pending |
| Scope is every stubbed screen | The whole app should be usable, not only the hackathon path | — Pending |
| Build functionality first with light polish | Keep drag-and-drop; leave out J/K review, chords and Playwright | — Pending |
| Credits belong to the founder user, not the Startup | Matches where `planTier` lives; spendable on any startup they found | ✓ Good (shipped in backend) |
| Payment fulfils through the webhook, never the redirect | The tab can close before the redirect | ✓ Good (shipped in backend) |
| Change the schema directly with no migrations | No production data yet | ✓ Good |

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
*Last updated: 2026-10-04 after restructure (old design docs folded in and deleted)*
