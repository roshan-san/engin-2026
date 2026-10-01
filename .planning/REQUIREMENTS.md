# Requirements: Engin

**Defined:** 2026-10-01
**Core Value:** A founder can create, pay for, publish and run a hiring hackathon end to end in the app, and a contributor can find it, enter, ship and get a verdict that shows on their Score.

## v1 Requirements

### Hiring (founder)

- [ ] **HIRE-01**: Founder sees the Startup's Roles and Trial Cycles (draft, open, running, closed, cancelled) on the Hiring screen
- [ ] **HIRE-02**: Founder can create and close a Role
- [ ] **HIRE-03**: Founder can create a draft Trial Cycle for a Role with dates, admission mode, optional application deadline, optional prize and seeded challenges
- [ ] **HIRE-04**: Founder sees their hackathon credit balance (by source and expiry) on the Hiring screen
- [ ] **HIRE-05**: Founder can claim a launch/UPI code (any case, spaces or dashes) and the balance goes up by 1; reusing a code shows an error
- [ ] **HIRE-06**: Founder can publish a draft by ticking the IP acknowledgment; publish spends exactly one credit (double-click or two tabs never spend two) and the hackathon appears on Discover
- [ ] **HIRE-07**: When publish is blocked, the founder sees the backend's reason with the fix: no credit → pay; stealth on → asked to go public first; dates passed → a "pick new dates" prompt
- [ ] **HIRE-08**: Founder with no credit goes to Dodo checkout in INR (₹2,999 on Free, ₹1,499 on Pro); after paying, the webhook auto-publishes the draft. Returning from checkout shows the live state from the backend, not the redirect (works even if the tab was closed)
- [ ] **HIRE-10**: If payment lands after the draft's dates passed, the credit shows in the balance and the draft stays a draft with the "pick new dates" prompt
- [ ] **HIRE-09**: Founder can reschedule a draft's dates and cancel a draft or published Trial Cycle

### Public hackathon & entry

- [ ] **PUBL-01**: Anyone (signed out too) can open a public hackathon page showing startup, role, deadline, dates, challenges, participant count, prize and the IP notice
- [ ] **PUBL-02**: Discover and the startup's public page (`/startup/$slug` openings) list only published hackathons; drafts and stealth startups never appear
- [ ] **PUBL-03**: Signed-in contributor can apply or join from the hackathon page after ticking the IP acknowledgment; signed-out visitors are asked to sign in first
- [ ] **PUBL-04**: Contributor sees the backend's exact rejection message when blocked: own startup's founder/member, full, closed, or the 6th live entry ("You're in 5 hackathons already. Finish or withdraw from one to join another.")
- [ ] **PUBL-05**: Contributor sees their own entries and their status, and can withdraw
- [ ] **PUBL-06**: Pricing page shows the Free vs Pro table from the design (members 5/50, stealth, ₹2,999 per hackathon on Free; Pro ₹999/mo or ₹9,999/yr with 1 credit a month, max 3 banked, ₹1,499 extras; contributors always free) and upgrades founders through Dodo in INR. No contributor Pro
- [ ] **PUBL-07**: Landing page positions Engin as the online hiring hackathon for early-stage startups (contributors free, verdicts name the issuing startup), with no "Linear alternative" or "pre-vetted" claims

### Trial run

- [ ] **RUN-01**: Founder sees applicants and accepts or rejects each one (application admission)
- [ ] **RUN-02**: Founder can add or remove challenges, including mid-trial
- [ ] **RUN-03**: Participant works their private Trial Board (pulses seeded from challenges) with proof links
- [ ] **RUN-04**: Participant and founders message in a private per-participant thread; founder posts announcements to every participant
- [ ] **RUN-05**: Founder gives each participant a verdict with an optional evaluation, and closing creates offers where earned and updates Score
- [ ] **RUN-06**: Participant can leave a running Trial Cycle and sees their verdict when it closes
- [ ] **RUN-07**: Contributor can accept or decline an offer; founder can withdraw one

### Profile

- [ ] **PROF-01**: Signed-in user sees and edits their own profile (name, username, bio, skills, location, links)
- [ ] **PROF-02**: Public profile (`/u/$username`) shows Score, proof of work and every verdict with the startup that issued it (Engin's own shown as Engin)
- [ ] **PROF-03**: User controls whether each evaluation is visible on their profile

### Launch ops

- [ ] **OPS-01**: Dodo INR products exist (Pro monthly ₹999, Pro yearly ₹9,999, Hackathon ₹2,999, Hackathon for Pro ₹1,499) in test mode and then live, with `DODO_MONTHLY_PLAN_ID`, `DODO_YEARLY_PLAN_ID`, `DODO_HACKATHON_PRODUCT_ID`, `DODO_HACKATHON_PRO_PRODUCT_ID` set in Convex
- [ ] **OPS-02**: The founder critical path works end to end on a real deployment: create draft → publish (credit or pay) → contributors apply/join → start → close with verdicts → offer accepted → Score updates. Engin runs its own hiring hackathon through it (design "Assignment" step 1)

### Work (Cycles & Pulses)

- [ ] **WORK-01**: Member sees the Startup's Cycles (active, planned, closed); founder creates a Cycle
- [ ] **WORK-02**: Member works a Cycle on a drag-and-drop board (todo, in progress, review, done) that also works on mobile
- [ ] **WORK-03**: Member creates, edits and deletes Pulses, assigns themselves and adds proof links
- [ ] **WORK-04**: Founder verifies or returns a Pulse in review
- [ ] **WORK-05**: Founder starts and closes a Cycle with carry-over of unfinished Pulses, and manages Cycle Members
- [ ] **WORK-06**: Signed-in user lands on My Pulses, showing their Cycle Pulses and Trial Board Pulses across all Startups

### Team & workspace

- [ ] **TEAM-01**: Member sees the team list; founder removes a member
- [ ] **TEAM-02**: Founder invites someone by email or username as Member or co-Founder and can revoke pending invites
- [ ] **TEAM-03**: Founder edits the Startup's settings (name, details, stealth toggle) and the Pitch sections
- [ ] **TEAM-04**: Member sees the Startup's activity feed
- [ ] **TEAM-05**: User sees an Inbox of notifications, invites and offers, newest first with unread count, and can mark read and act in place
- [ ] **TEAM-06**: User sees their Threads across all Trial Cycles they're in and opens each one

## v2 Requirements

### Polish

- **POL-01**: J/K keyboard review screen for verdicts
- **POL-02**: `C` quick-create Pulse/Cycle chord and palette entries
- **POL-03**: URL-addressable Pulse peek panel with inline editing
- **POL-04**: Playwright e2e on the hiring loop and checkout

### Pitch & growth

- **PITCH-01**: Pitch media uploads (logo, cover, screenshots)
- **PITCH-02**: Public Stats toggle
- **GROW-01**: Raise the 10-participant cap for public hackathons (decide after the first hackathon's application-to-join ratio)
- **GROW-02**: College placement dashboard (trigger: one college with 30+ students with Scores and 3+ hires)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Plan on the Startup (old ADR-0005) | Superseded: Pro and credits belong to the founder user, as the backend ships |
| Investor features | Frozen until 25 startups have each run a real Cycle |
| Equity kit | Legal complexity; after the first real hire |
| Paid visibility / paid contact | Founders pay to hire, never to reach talent |
| In-app prize payouts | Prize is free text, paid off-platform |
| Frontend unit tests | Repo tests only `convex/**/*.test.ts` |
| Light theme | Dark-only |
| Emails | Not in scope for v1 |
| Leaderboards, stars, likes, pitch battles, streaks or participation points in Score | Dropped in the design; Score stays founder-verified outcomes only |
| Automatic re-run credits | Granted by hand via `grantRerunCredit` |
| Incubator / placement-cell dashboards | Channel only / deferred revenue line |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 0
- Unmapped: 41 ⚠️

---
*Requirements defined: 2026-10-01*
*Last updated: 2026-10-01 after initial definition*
