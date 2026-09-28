# Roadmap: Engin

## Overview

This milestone rebuilds Engin's signed-in frontend Linear-style (ADR-0006) and finishes the
features it depends on. Phase 1 builds the app shell and routing every later screen lives in.
Phases 2–5 are vertical domain slices on top of it — Work (Cycles/Pulses), Team workspace (Invites,
Inbox, Pitch), Hiring (complete Trial Cycles) and Discover — each independently shippable once the
shell exists. Phase 6 closes the milestone: the Plan moves from User to Startup with enforced
limits and India-ready checkout, the landing and pricing pages tell the truth about the rebuilt
product, and a small Playwright suite locks in the critical flows across every phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Shell & Navigation Foundation** - Sidebar, Startup switcher, command palette, keyboard shortcuts, `/s/$slug` routing and the dark-only redesign every later screen lives in
- [ ] **Phase 2: My Pulses & Cycle Boards** - My Pulses home screen and the redesigned Cycle Board/List kanban with a peek panel
- [ ] **Phase 3: Team Workspace** - Invites by username/email with co-Founders, the Inbox, and the Focused Startup's Hiring/Team/Pitch/Activity screens
- [ ] **Phase 4: Complete Trial Cycles** - Challenges, Submissions, per-Participant Verdicts with a review screen, Announcements and Threads
- [ ] **Phase 5: Discover** - One public Discover page (Trial Cycles / Startups / Contributors) replacing Explore and Opportunities
- [ ] **Phase 6: Plans, Billing, Pricing & Landing** - Plan moves to the Startup with enforced limits and local-currency checkout; landing/pricing rewritten; Playwright coverage on the critical flows

## Phase Details

### Phase 1: Shell & Navigation Foundation

**Goal**: Users navigate Engin through the new Linear-style shell — sidebar, Startup switcher, command palette and keyboard shortcuts — with every Startup-scoped screen's URL carrying its Startup.
**Depends on**: Nothing (first phase)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, SHELL-07
**Success Criteria** (what must be TRUE):
  1. A signed-in User sees a sidebar with Inbox/My Pulses/Threads, a Startup switcher, and a Focused-Startup section, with a bottom tab bar on mobile.
  2. Every Startup-scoped screen's URL contains the Startup's slug and there is no `/app` prefix; reopening the app returns to the User's last Focused Startup.
  3. Pressing ⌘K/Ctrl+K opens a command palette that jumps to any screen, Startup or Cycle; pressing `?` lists every keyboard shortcut, sourced from one shortcut registry.
  4. The interface renders dark-only with the new accent colour and typeface, replacing the old shell.
  5. A signed-in User opens a Pitch, a profile or Discover without leaving the app shell; a signed-out visitor sees the same pages with a simple public header.

**Plans**: 9 plans

Plans:
**Wave 1**
- [ ] 01-01-PLAN.md — Backend: rename to focusedStartupId, getBySlug (role + Plan block), listMemberships, focus, clear on Member removal (wave 1)
- [ ] 01-02-PLAN.md — Backend: every notification link carries the Startup slug via convex/lib/links.ts (wave 1)
- [ ] 01-03-PLAN.md — Dark-only tokens, Geist, soft-square primitives, shadcn shell primitives (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 01-04-PLAN.md — New route tree: _shell/_authed layouts, /s/$slug resolution + focus, _member gate, stubs, sign-in lands on /my-pulses (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 01-05-PLAN.md — Public pages (Pitch, profile, Discover, Invite) inside the shell; public header with Sign in (wave 3)
- [ ] 01-06-PLAN.md — Desktop sidebar, Startup switcher, account menu with Score, Inbox badge (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 01-07-PLAN.md — Mobile tab bar, Startup sheet, top bar, account sheet, Inbox/Threads segments (wave 4)
- [ ] 01-08-PLAN.md — Remove the old /app app; last ui/ to pages/ moves; kept code repointed (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 01-09-PLAN.md — Shortcut registry, ⌘K palette, ? sheet, / search, hints (wave 5)

**UI hint**: yes

### Phase 2: My Pulses & Cycle Boards

**Goal**: Members work their Cycle Pulses and Trial Board Pulses through the redesigned kanban and peek panel, landing on My Pulses right after sign-in.
**Depends on**: Phase 1
**Requirements**: WORK-01, WORK-02, WORK-03, WORK-04
**Success Criteria** (what must be TRUE):
  1. A signed-in User lands on My Pulses, showing their Cycle Pulses and Board Pulses across every Startup, grouped by status.
  2. A Cycle can be viewed as a drag-and-drop Board or a List, on desktop and mobile, with a disallowed drag visibly refused.
  3. Opening a Pulse shows a URL-addressable peek panel where Proof Links live and a Founder can verify or return a Submitted Pulse with a note.
  4. A Founder creates, starts and closes Cycles — including carrying unfinished Pulses forward — and manages Cycle Members from the new screens.

**Plans**: TBD
**UI hint**: yes

### Phase 3: Team Workspace

**Goal**: Founders and Members run their team, Invites, Inbox and Pitch from the Focused Startup area.
**Depends on**: Phase 1
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, TEAM-06, TEAM-07
**Success Criteria** (what must be TRUE):
  1. A Founder invites someone by username or email, as Member or co-Founder, and the invitee accepts or declines from their Inbox.
  2. An Inbox lists notifications, Offers and Invites newest-first with an unread count, answerable in place and linking to the exact screen each item is about.
  3. A Founder edits Pitch sections, uploads a logo/cover/screenshots, and toggles Public Stats, which then render (or don't) on the public Pitch.
  4. A User's public profile shows Score, Proof of Work and any Evaluations they chose to show.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Complete Trial Cycles

**Goal**: Trial Cycles run end to end — Challenges, Submissions, per-Participant Verdicts and Threads — matching the CONTEXT.md glossary in full.
**Depends on**: Phase 1
**Requirements**: HIRE-01, HIRE-02, HIRE-03, HIRE-04, HIRE-05, HIRE-06, HIRE-07, HIRE-08
**Success Criteria** (what must be TRUE):
  1. A Founder defines Challenges on a Trial Cycle and adds one mid-trial; it reaches every current Participant's Board without touching existing copies.
  2. A Participant submits a summary with a Proof Link, overwrites it until the end date, and it locks with their Board on a Verdict or the end date.
  3. A Founder steps through Participants with `J`/`K` on a review screen and gives a Verdict (with an optional Evaluation) one at a time; the last Verdict auto-closes the Trial Cycle, creates an Offer where earned, and refreshes Score.
  4. A Founder posts an Announcement every current Participant receives, and each Participant has a private Thread with the Founders that becomes read-only when the Trial Cycle closes.
  5. A Founder cancels a Trial Cycle before any Verdicts with no Score consequence for anyone.

**Plans**: TBD

### Phase 5: Discover

**Goal**: Anyone browses one public Discover page to find Trial Cycles, Startups and Contributors, ranked on merit only.
**Depends on**: Phase 1, Phase 3 (Invite-from-card reuses TEAM-01's Invite backend)
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04
**Success Criteria** (what must be TRUE):
  1. A visitor browses Discover's three tabs (Trial Cycles, Startups, Contributors) signed out, asked to sign in only on Join/Apply.
  2. Trial Cycles, Startups and Contributors can each be filtered/sorted (skills/remote/location; category/stage/tech stack/followers; Score), with bounded page sizes.
  3. A Startup in Stealth is absent from Discover but still opens from its own link.
  4. A Founder invites a Contributor to their team straight from a Discover card or profile.

**Plans**: TBD
**UI hint**: yes

### Phase 6: Plans, Billing, Pricing & Landing

**Goal**: The Plan belongs to the Startup with enforced, shared limits and working India-ready checkout, and the public-facing pages present the redesigned product honestly.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 (needs real screens for the landing page and stable limits across every creation flow)
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, MKTG-01, MKTG-02, TEST-01
**Success Criteria** (what must be TRUE):
  1. A Founder upgrades their Startup (not their personal account) to Pro via checkout priced in local currency with UPI and a discount-code field.
  2. Hitting a Free limit throws a structured error the UI turns into an upgrade prompt stating the real numbers, exactly at the moment it happens.
  3. A downgrade never removes anything that already exists; a Billing screen shows the Plan, usage against each limit, and the paying Founder.
  4. The landing page leads with "The fast lane for founders" and shows real screens of the redesigned product; the pricing page lists only backend-enforced limits.
  5. A Playwright suite passes against an isolated deployment, covering sign-in → My Pulses → switch Startup, the full hiring loop, Cycle Pulse creation/verification, hitting a limit, and signed-out Discover browsing.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Shell & Navigation Foundation | 0/9 | Planned | - |
| 2. My Pulses & Cycle Boards | 0/TBD | Not started | - |
| 3. Team Workspace | 0/TBD | Not started | - |
| 4. Complete Trial Cycles | 0/TBD | Not started | - |
| 5. Discover | 0/TBD | Not started | - |
| 6. Plans, Billing, Pricing & Landing | 0/TBD | Not started | - |
