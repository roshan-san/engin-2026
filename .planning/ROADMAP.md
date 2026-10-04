# Roadmap: Engin

## Overview

This milestone replaces every stub screen left by the shell redesign with working screens on the existing Convex backend, money path first. Phases 1–4 take a founder from a draft hackathon through payment, public entry, the trial run and verdicts on public profiles. They end with Engin running its own hiring hackathon (the design's "Assignment" step 1). Phases 5–7 rebuild the rest of the signed-in app: Cycles and My Pulses, team workspace screens, and the Inbox and Threads. Each phase ships whole screens end to end.

Product rules (pricing, publish gate, credits, entry) live in `PROJECT.md` → Context.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Founder Hiring & Publish** - Hiring screen with Roles, drafts, credit balance, code claim, publish gate and Dodo checkout
- [ ] **Phase 2: Public Hackathon, Entry & Pricing** - Public hackathon page, Discover listing, apply/join with IP tick, my entries, pricing and landing rewrite
- [ ] **Phase 3: Trial Run & Offers** - TrialCyclePage: applicants, challenges, participant boards, threads, announcements, verdicts and offers
- [ ] **Phase 4: Profiles & Engin's Own Hackathon** - Own and public profile with Score and issuing-startup verdicts; full critical path verified live
- [ ] **Phase 5: Cycles & My Pulses** - Cycles list, drag-and-drop Cycle board, Pulse editing and review, My Pulses home
- [ ] **Phase 6: Team Workspace** - Team, invites, settings with stealth, Pitch editor, Activity
- [ ] **Phase 7: Inbox & Threads** - Inbox of notifications/invites/offers and the Threads list

## Phase Details

### Phase 1: Founder Hiring & Publish
**Goal:** A founder creates a Role and a draft Trial Cycle, then publishes it with a credit, a claimed code or a Dodo payment, from `/s/$slug/hiring`.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** HIRE-01, HIRE-02, HIRE-03, HIRE-04, HIRE-05, HIRE-06, HIRE-07, HIRE-08, HIRE-09, HIRE-10, OPS-01
**Success Criteria** (what must be TRUE):
  1. A founder creates a Role and a draft Trial Cycle (dates, admission, deadline, prize, challenges), and it shows as a draft on the Hiring screen and nowhere public.
  2. A founder with a credit ticks the IP acknowledgment, publishes, and the hackathon goes open with the balance down by exactly one, even on a double-click.
  3. Claiming a launch code raises the balance by 1, and reusing it shows an error.
  4. A founder with no credit pays ₹2,999 (Free) or ₹1,499 (Pro) through Dodo test-mode checkout, and the draft auto-publishes via the webhook. If the dates already passed, the credit stays in the balance and a "pick new dates" prompt appears.
  5. A stealth startup's publish asks the founder to go public first; reschedule and cancel work from the same screen.
**Plans:** TBD
**UI hint:** yes

### Phase 2: Public Hackathon, Entry & Pricing
**Goal:** Contributors find a published hackathon, read its public page and enter it, and founders see honest INR pricing.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** PUBL-01, PUBL-02, PUBL-03, PUBL-04, PUBL-05, PUBL-06, PUBL-07
**Success Criteria** (what must be TRUE):
  1. A signed-out visitor opens a hackathon page showing startup, role, deadline, dates, challenges, participant count, prize and IP notice, and is asked to sign in only on Apply/Join.
  2. Discover and `/startup/$slug` list only published hackathons; drafts and stealth startups never appear.
  3. A contributor ticks the IP acknowledgment and applies or joins. A founder/member of that startup, or someone on their 6th live entry, sees the backend's exact message.
  4. A contributor sees their entries with status and can withdraw.
  5. `/pricing` shows the Free vs Pro INR table from the design and upgrades a founder through Dodo; the landing page pitches the hiring hackathon with no "Linear alternative" or "pre-vetted" claims.
**Plans:** TBD
**UI hint:** yes

### Phase 3: Trial Run & Offers
**Goal:** A published hackathon runs end to end on `/s/$slug/trials/$trialCycleId`: admission, challenges, private boards, threads, verdicts and offers.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** RUN-01, RUN-02, RUN-03, RUN-04, RUN-05, RUN-06, RUN-07
**Success Criteria** (what must be TRUE):
  1. A founder accepts or rejects applicants, and adds a challenge mid-trial that reaches every current participant's board.
  2. A participant works their private Trial Board with proof links and messages the founders in their own thread; an announcement reaches every participant.
  3. A founder gives each participant a verdict with an optional evaluation; closing creates offers where earned and updates Score.
  4. A participant can leave mid-trial and sees their verdict after close; a contributor accepts or declines an offer, and a founder can withdraw one.
**Plans:** TBD
**UI hint:** yes

### Phase 4: Profiles & Engin's Own Hackathon
**Goal:** Users manage their profile and show verdicts publicly, and the full founder critical path is proven live by Engin hiring through it.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** PROF-01, PROF-02, PROF-03, OPS-02
**Success Criteria** (what must be TRUE):
  1. A signed-in user edits name, username, bio, skills, location and links from `/profile`.
  2. `/u/$username` shows Score, proof of work and each verdict with its issuing startup (Engin's shown as Engin), and the user controls each evaluation's visibility.
  3. On a real deployment: create draft → publish → apply/join → start → close with verdicts → offer accepted → Score updates, with no manual DB edits.
  4. Engin's own hiring hackathon (3 scoped challenges, 5 days) is published through the app.
**Plans:** TBD
**UI hint:** yes

### Phase 5: Cycles & My Pulses
**Goal:** Members run internal work in Cycles of Pulses on a drag-and-drop board and land on My Pulses after sign-in.
**Mode:** mvp
**Depends on:** Nothing (independent of Phases 1–4; scheduled after them by priority)
**Requirements:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06
**Success Criteria** (what must be TRUE):
  1. A member sees Active, Planned and Closed Cycles; a founder creates one.
  2. A member drags Pulses across todo, in progress, review and done on desktop and mobile, and a disallowed move is visibly refused.
  3. A member creates, edits and deletes Pulses, assigns themselves and adds proof links; a founder verifies or returns a Pulse in review.
  4. A founder starts and closes a Cycle with carry-over and manages Cycle Members.
  5. Signing in lands on My Pulses, showing the user's Cycle Pulses and Trial Board Pulses across all Startups.
**Plans:** TBD
**UI hint:** yes

### Phase 6: Team Workspace
**Goal:** Founders run their team, settings and Pitch, and members follow the Startup's activity, from the Focused Startup area.
**Mode:** mvp
**Depends on:** Nothing (independent; Phase 1's stealth prompt links here once it ships)
**Requirements:** TEAM-01, TEAM-02, TEAM-03, TEAM-04
**Success Criteria** (what must be TRUE):
  1. A member sees the team; a founder removes a member.
  2. A founder invites by email or username as Member or co-Founder and revokes pending invites.
  3. A founder edits Startup details and Pitch sections and toggles stealth, and the public Pitch reflects it.
  4. A member sees the Startup's activity feed.
**Plans:** TBD
**UI hint:** yes

### Phase 7: Inbox & Threads
**Goal:** Users handle everything addressed to them from the Inbox and reach every Trial Cycle thread from one Threads screen.
**Mode:** mvp
**Depends on:** Phase 3 (threads), Phase 6 (invites)
**Requirements:** TEAM-05, TEAM-06
**Success Criteria** (what must be TRUE):
  1. The Inbox lists notifications, invites and offers newest first with an unread count, marks them read, and lets the user accept/decline in place.
  2. Each Inbox item links to the exact screen it's about.
  3. Threads lists every Trial Cycle thread the user is in and opens each one.
**Plans:** TBD
**UI hint:** yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Founder Hiring & Publish | 0/TBD | Not started | - |
| 2. Public Hackathon, Entry & Pricing | 0/TBD | Not started | - |
| 3. Trial Run & Offers | 0/TBD | Not started | - |
| 4. Profiles & Engin's Own Hackathon | 0/TBD | Not started | - |
| 5. Cycles & My Pulses | 0/TBD | Not started | - |
| 6. Team Workspace | 0/TBD | Not started | - |
| 7. Inbox & Threads | 0/TBD | Not started | - |
