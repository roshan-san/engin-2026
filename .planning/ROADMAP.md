# Roadmap: Engin

## Overview

This milestone replaces every stub screen left by the shell redesign with working screens on the existing Convex backend, money path first. Phases 1–10 take a founder from a draft hackathon through payment, public entry, the trial run and verdicts on public profiles. They end with Engin running its own hiring hackathon (the design's "Assignment" step 1). Phases 11–14 rebuild the rest of the signed-in app: Cycles and My Pulses, team workspace screens, and the Inbox and Threads. Each phase ships whole screens end to end.

Phases are deliberately small (2–4 requirements each) to keep each plan/execute run's context and token usage low.

Product rules (pricing, publish gate, credits, entry) live in `PROJECT.md` → Context.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Hiring Screen & Drafts** - Hiring screen with Roles and Trial Cycles; create/close Role; create, edit, reschedule and cancel drafts
- [ ] **Phase 2: Credits & Publish** - Credit balance, signup credit, Pro as workspace plan, publish gate with IP tick and blocked-state messages
- [ ] **Phase 3: Dodo Checkout** - Dodo INR products, checkout, webhook auto-publish, return-from-checkout and dates-passed handling
- [ ] **Phase 4: Public Hackathon Page & Discover** - Public hackathon page and published-only listings on Discover and `/startup/$slug`
- [ ] **Phase 5: Entry & My Entries** - Apply/join with IP tick, exact rejection messages, my entries with withdraw
- [ ] **Phase 6: Pricing & Landing** - `/pricing` Free vs Pro INR table with Dodo upgrade; landing page rewrite
- [ ] **Phase 7: Admission & Challenges** - TrialCyclePage applicants accept/reject; add/remove challenges mid-trial
- [ ] **Phase 8: Trial Boards & Announcements** - Private participant Trial Boards with proof links, announcements, leaving a trial
- [ ] **Phase 9: Verdicts & Offers** - Verdicts with evaluations, close creates offers and updates Score, offer accept/decline/withdraw
- [ ] **Phase 10: Profiles & Engin's Own Hackathon** - Own and public profile with Score and issuing-startup verdicts; full critical path verified live
- [ ] **Phase 11: Cycles & Board** - Cycles list, create/start/close with carry-over, Cycle Members, drag-and-drop board
- [ ] **Phase 12: Pulses & My Pulses** - Pulse create/edit/delete, proof links, verify/return, My Pulses home
- [ ] **Phase 13: Team Workspace** - Team, invites, settings with stealth, Pitch editor, Activity
- [ ] **Phase 14: Inbox & Threads** - Inbox of notifications/invites/offers and the Threads list

## Phase Details

### Phase 1: Hiring Screen & Drafts
**Goal:** A founder sees Roles and Trial Cycles on `/s/$slug/hiring`, creates and closes Roles, and creates, edits, reschedules and cancels draft hackathons.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** HIRE-01, HIRE-02, HIRE-03, HIRE-09
**Context:** `phases/01-hiring-screen-drafts/01-CONTEXT.md` (covers Phases 1–3)
**Success Criteria** (what must be TRUE):
  1. A founder sees the Startup's Roles and Trial Cycles grouped by status (draft, open, running, closed, cancelled).
  2. A founder creates a Role and closes it; closing is blocked while the Role has hackathons.
  3. A founder creates a draft Trial Cycle (dates, application admission, deadline, prize, challenges) and edits it; it shows as a draft and nowhere public.
  4. A founder reschedules a draft's dates and cancels a draft or published Trial Cycle.
**Plans:** TBD
**UI hint:** yes

### Phase 2: Credits & Publish
**Goal:** A founder with a credit publishes a draft safely, and every blocked publish explains its fix.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** HIRE-04, HIRE-05, HIRE-06, HIRE-07
**Context:** `phases/01-hiring-screen-drafts/01-CONTEXT.md`
**Success Criteria** (what must be TRUE):
  1. A founder sees their credit balance on the Hiring screen; a new account starts with 1 free credit and no codes exist in the app.
  2. A founder ticks the IP acknowledgment and publishes; the hackathon goes open with the balance down by exactly one, even on a double-click or two tabs.
  3. Cancelling a published hackathon before it starts returns the credit.
  4. A blocked publish shows the backend's reason with its fix: no credit → pay, stealth → go public first, dates passed → pick new dates.
**Plans:** TBD
**UI hint:** yes

### Phase 3: Dodo Checkout
**Goal:** A founder with no credit pays through Dodo in INR and the draft publishes itself.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** HIRE-08, HIRE-10, OPS-01
**Context:** `phases/01-hiring-screen-drafts/01-CONTEXT.md`
**Success Criteria** (what must be TRUE):
  1. Dodo test-mode INR products exist and their IDs are set as Convex env vars.
  2. A founder with no credit pays ₹2,999 (Free) or ₹1,499 (Pro) through test-mode checkout, and the webhook auto-publishes the draft.
  3. Returning from checkout shows the live backend state, and it works even if the tab was closed.
  4. If the dates already passed when payment lands, the credit stays in the balance and the draft shows the "pick new dates" prompt.
**Plans:** TBD
**UI hint:** yes

### Phase 4: Public Hackathon Page & Discover
**Goal:** Anyone can find a published hackathon and read its public page.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** PUBL-01, PUBL-02
**Success Criteria** (what must be TRUE):
  1. A signed-out visitor opens a hackathon page showing startup, role, deadline, dates, challenges, participant count, prize and IP notice.
  2. Discover and `/startup/$slug` list only published hackathons; drafts and stealth startups never appear.
**Plans:** TBD
**UI hint:** yes

### Phase 5: Entry & My Entries
**Goal:** Contributors enter a hackathon, get honest rejections, and manage their entries.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** PUBL-03, PUBL-04, PUBL-05
**Success Criteria** (what must be TRUE):
  1. A signed-out visitor is asked to sign in only on Apply/Join; a signed-in contributor ticks the IP acknowledgment and applies or joins.
  2. A founder/member of that startup, or someone on their 6th live entry, or a full/closed hackathon sees the backend's exact message.
  3. A contributor sees their entries with status and can withdraw.
**Plans:** TBD
**UI hint:** yes

### Phase 6: Pricing & Landing
**Goal:** Founders see honest INR pricing and can upgrade; the landing page pitches the hiring hackathon.
**Mode:** mvp
**Depends on:** Phase 3 (Dodo products)
**Requirements:** PUBL-06, PUBL-07
**Success Criteria** (what must be TRUE):
  1. `/pricing` shows the Free vs Pro INR table from the design and upgrades a founder to Pro through Dodo.
  2. The landing page pitches the online hiring hackathon (contributors free, verdicts name the issuing startup) with no "Linear alternative" or "pre-vetted" claims.
**Plans:** TBD
**UI hint:** yes

### Phase 7: Admission & Challenges
**Goal:** On `/s/$slug/trials/$trialCycleId`, a founder admits applicants and shapes the challenges.
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** RUN-01, RUN-02
**Success Criteria** (what must be TRUE):
  1. A founder sees applicants and accepts or rejects each one.
  2. A founder adds or removes challenges, including mid-trial, and an added challenge reaches every current participant's board.
**Plans:** TBD
**UI hint:** yes

### Phase 8: Trial Boards & Announcements
**Goal:** Participants work their private boards and hear from founders; they can leave.
**Mode:** mvp
**Depends on:** Phase 7
**Requirements:** RUN-03, RUN-04, RUN-06
**Success Criteria** (what must be TRUE):
  1. A participant works their private Trial Board (pulses seeded from challenges) with proof links.
  2. A founder's announcement reaches every participant; there are no private founder↔participant DMs.
  3. A participant can leave a running Trial Cycle.
**Plans:** TBD
**UI hint:** yes

### Phase 9: Verdicts & Offers
**Goal:** A founder closes the trial with verdicts, and offers flow to contributors.
**Mode:** mvp
**Depends on:** Phase 8
**Requirements:** RUN-05, RUN-07
**Success Criteria** (what must be TRUE):
  1. A founder gives each participant a verdict with an optional evaluation; closing creates offers where earned and updates Score.
  2. A participant sees their verdict after close.
  3. A contributor accepts or declines an offer, and a founder can withdraw one.
**Plans:** TBD
**UI hint:** yes

### Phase 10: Profiles & Engin's Own Hackathon
**Goal:** Users manage their profile and show verdicts publicly, and the full founder critical path is proven live by Engin hiring through it.
**Mode:** mvp
**Depends on:** Phase 9
**Requirements:** PROF-01, PROF-02, PROF-03, OPS-02
**Success Criteria** (what must be TRUE):
  1. A signed-in user edits name, username, bio, skills, location and links from `/profile`.
  2. `/u/$username` shows Score, proof of work and each verdict with its issuing startup (Engin's shown as Engin), and the user controls each evaluation's visibility.
  3. On a real deployment: create draft → publish → apply/join → start → close with verdicts → offer accepted → Score updates, with no manual DB edits.
  4. Engin's own hiring hackathon (3 scoped challenges, 5 days) is published through the app.
**Plans:** TBD
**UI hint:** yes

### Phase 11: Cycles & Board
**Goal:** Members see and run Cycles on a drag-and-drop board; founders manage the Cycle lifecycle.
**Mode:** mvp
**Depends on:** Nothing (independent of Phases 1–10; scheduled after them by priority)
**Requirements:** WORK-01, WORK-02, WORK-05
**Success Criteria** (what must be TRUE):
  1. A member sees Active, Planned and Closed Cycles; a founder creates one.
  2. A member drags Pulses across todo, in progress, review and done on desktop and mobile, and a disallowed move is visibly refused.
  3. A founder starts and closes a Cycle with carry-over and manages Cycle Members.
**Plans:** TBD
**UI hint:** yes

### Phase 12: Pulses & My Pulses
**Goal:** Members manage Pulses with proof, founders review them, and sign-in lands on My Pulses.
**Mode:** mvp
**Depends on:** Phase 11
**Requirements:** WORK-03, WORK-04, WORK-06
**Success Criteria** (what must be TRUE):
  1. A member creates, edits and deletes Pulses, assigns themselves and adds proof links.
  2. A founder verifies or returns a Pulse in review.
  3. Signing in lands on My Pulses, showing the user's Cycle Pulses and Trial Board Pulses across all Startups.
**Plans:** TBD
**UI hint:** yes

### Phase 13: Team Workspace
**Goal:** Founders run their team, settings and Pitch, and members follow the Startup's activity, from the Focused Startup area.
**Mode:** mvp
**Depends on:** Nothing (independent; Phase 2's stealth prompt links here once it ships)
**Requirements:** TEAM-01, TEAM-02, TEAM-03, TEAM-04
**Success Criteria** (what must be TRUE):
  1. A member sees the team; a founder removes a member.
  2. A founder invites by email or username as Member or co-Founder and revokes pending invites.
  3. A founder edits Startup details and Pitch sections and toggles stealth, and the public Pitch reflects it.
  4. A member sees the Startup's activity feed.
**Plans:** TBD
**UI hint:** yes

### Phase 14: Inbox & Threads
**Goal:** Users handle everything addressed to them from the Inbox and reach every Trial Cycle's announcements from one Threads screen.
**Mode:** mvp
**Depends on:** Phase 8 (announcements), Phase 13 (invites)
**Requirements:** TEAM-05, TEAM-06
**Success Criteria** (what must be TRUE):
  1. The Inbox lists notifications, invites and offers newest first with an unread count, marks them read, and lets the user accept/decline in place.
  2. Each Inbox item links to the exact screen it's about.
  3. Threads lists the announcements of every Trial Cycle the user is in and opens each one.
**Plans:** TBD
**UI hint:** yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → … → 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Hiring Screen & Drafts | 0/TBD | Not started | - |
| 2. Credits & Publish | 0/TBD | Not started | - |
| 3. Dodo Checkout | 0/TBD | Not started | - |
| 4. Public Hackathon Page & Discover | 0/TBD | Not started | - |
| 5. Entry & My Entries | 0/TBD | Not started | - |
| 6. Pricing & Landing | 0/TBD | Not started | - |
| 7. Admission & Challenges | 0/TBD | Not started | - |
| 8. Trial Boards & Announcements | 0/TBD | Not started | - |
| 9. Verdicts & Offers | 0/TBD | Not started | - |
| 10. Profiles & Engin's Own Hackathon | 0/TBD | Not started | - |
| 11. Cycles & Board | 0/TBD | Not started | - |
| 12. Pulses & My Pulses | 0/TBD | Not started | - |
| 13. Team Workspace | 0/TBD | Not started | - |
| 14. Inbox & Threads | 0/TBD | Not started | - |
