# Requirements: Engin

**Defined:** 2026-09-28
**Core Value:** People join startups by proving themselves in time-boxed, real-work Trial Cycles, and build a public reputation (Score) from verified work.

**Source:** No PRD/SPEC files exist in this repo. Scope was pulled directly from GitHub issues via
`gh issue view`: issue #19 (primary spec, newest and largest) plus the open child slices of parent
spec #2 (#4, #9, #15, #16, #17, #18). Issue #1 is reference only — its slices already shipped. Where
#19 overlaps or supersedes an open #2 slice, the requirement below is merged and cites both issues.

## v1 Requirements

Requirements for this milestone (the Linear-style redesign + completed Trial Cycles + Startup
Plans). Each maps to exactly one roadmap phase.

### Navigation & Shell (SHELL)

- [ ] **SHELL-01**: Signed-in User sees a sidebar with Inbox/My Pulses/Threads (spanning every Startup they're in), a Startup switcher, and a Focused-Startup section (Cycles, Hiring, Team, Pitch, Activity); on mobile, a bottom tab bar (Inbox · My Pulses · Startup · Discover). *(src: #19)*
- [x] **SHELL-02**: Every Startup-scoped screen's URL carries the Startup's slug (`/s/$slug/...`), with no `/app` prefix; the app reopens on the User's last Focused Startup; a User with no Startup sees "Create a Startup" in the switcher. *(src: #19)*
- [x] **SHELL-03**: Signed-in Users browse public pages (a Pitch, a profile, Discover) inside the app shell; signed-out visitors see the same pages under a simple public header with a sign-in button; a page requiring sign-in redirects there instead of breaking. *(src: #19)*
- [x] **SHELL-04**: The interface renders dark-only with one semantic-token accent colour and typeface, replacing the current stock dark theme. *(src: #19)*
- [x] **SHELL-05**: ⌘K/Ctrl+K opens a command palette (jump to screens/Startups/Cycles, create things); `C` creates a Pulse in context; `/` focuses search; `?` opens a shortcuts sheet; every tooltip/menu item/palette row shows its shortcut; single-key shortcuts are ignored while typing in a field. One shortcut registry feeds all four surfaces. *(src: #19)*
- [x] **SHELL-06**: The frontend is reorganised per ADR-0006 — `src/shell/` (app frame, no backend counterpart), `src/features/<domain>/<feature>/pages/` (renamed from `ui/`), and frontend-only `discover`/`marketing` surfaces. *(src: #19, ADR-0006)*
- [x] **SHELL-07**: A backend query looks up a Startup by slug and returns the Startup, the caller's role (or none), and the Startup's Plan/limits/usage in one call; the switcher is fed by the caller's memberships; `users.activeStartupId` is renamed to match "Focused Startup" and is cleared when the User stops belonging to that Startup. *(src: #19)*

### Work: My Pulses & Cycles (WORK)

- [ ] **WORK-01**: A signed-in User lands on My Pulses after sign-in, showing Cycle Pulses assigned to them (across every Startup) and Board Pulses in their live Trial Cycles, grouped by status and labelled with their Startup and Cycle/Trial Cycle; a User with none sees "Find a Trial Cycle" / "Create a Startup". *(src: #19)*
- [ ] **WORK-02**: A Cycle can be viewed as a drag-and-drop Board (todo/in progress/review/done, via dnd-kit with pointer/touch/keyboard sensors) or a List grouped by status; a disallowed drag (e.g. an assignee moving a Submitted Pulse, a Member moving to done) is visibly refused, matching backend rules. *(src: #19)*
- [ ] **WORK-03**: A Pulse opens in a peek panel (addressable via a URL search param, closes on Esc, full-screen below the desktop breakpoint) where Proof Links are added/viewed/removed, and a Founder verifies a Submitted Pulse or returns it to in-progress with a note. *(src: #19)*
- [ ] **WORK-04**: A Pulse is created from a quick dialog (`C` shortcut); a Founder creates, starts and closes Cycles from the new screens — including carrying unfinished Pulses to another Cycle on close — and adds/removes Cycle Members; Members continue to see only Cycles they belong to. *(src: #19)*

### Team Workspace (TEAM)

- [ ] **TEAM-01**: A Founder finds a teammate by username or by email and sends an Invite as Member or co-Founder; an unknown username errors clearly; an unknown email's Invite waits and is attached (with a notification) when that email signs up; re-inviting someone with a pending Invite refreshes its 14-day expiry instead of duplicating; inviting an existing Member errors; a copyable token link stays as a fallback; an Invite with role `founder` grants full Founder permissions. *(src: #2, #4)*
- [ ] **TEAM-02**: An Inbox screen lists notifications, Offers and Invites newest-first, with an unread/actionable count in the sidebar and mobile tab; Offers and Invites are accepted or declined right there; an item opens in a split view (desktop) or full-screen (mobile) and links to the exact screen it's about; items are markable read one at a time or all at once. *(src: #19)*
- [ ] **TEAM-03**: The Focused Startup's Hiring screen lists its Roles, Trial Cycles and Applicants together; its Team screen lists Members and pending Invites; its Activity screen (separate from the Cycle board) shows the events the viewer is allowed to see. *(src: #19)*
- [ ] **TEAM-04**: Any co-Founder edits the Pitch's sections and chooses whether Public Stats are shown; a Startup a User creates becomes their Focused Startup immediately. *(src: #19)*
- [ ] **TEAM-05**: A Founder uploads, replaces or removes the Pitch's logo, cover image and up to a capped number of screenshots via Convex file storage; the public Pitch and Discover cards render them, with sensible fallbacks when absent. *(src: #2, #16)*
- [ ] **TEAM-06**: With a `showPublicStats` toggle on, the public Pitch shows team size, Verified Pulses in the last 30 days, Cycles completed, Trial Cycles run and hires from Trial Cycles; with it off, the public query returns none of those numbers. *(src: #2, #17)*
- [ ] **TEAM-07**: A User's public profile shows Score, Proof of Work and the Evaluations they chose to show; a User edits their own profile inside the new shell. *(src: #19)*

### Hiring: Complete Trial Cycles (HIRE)

- [ ] **HIRE-01**: A Founder creates a Trial Cycle for a Role with dates, Admission mode and Capacity, and defines Challenges on it; a Challenge added after the start is copied onto every current Participant's Board in `todo` and notifies them; editing or deleting a Challenge never changes existing copies; a Founder gets a Copy-link button. *(src: #19, #15)*
- [ ] **HIRE-02**: A Founder of an application-admission Trial Cycle admits or rejects Applicants, and posts Announcements that every current Participant can read and is notified of. *(src: #19)*
- [ ] **HIRE-03**: A Founder trial dashboard lists every Participant with Board progress, Submission status and Verdict at a glance; a Founder opens any Participant's Board read-only. *(src: #19, #15)*
- [ ] **HIRE-04**: A Participant writes a Submission (summary + at least one Proof Link) they can overwrite until the end date, which notifies Founders; a Verdict or the end date locks that Participant's Board and Submission together. *(src: #19, #9)*
- [ ] **HIRE-05**: A Founder gives a Verdict (plus an optional Evaluation) to one Participant at a time, from a review screen showing that Participant's Board, Submission and Thread together, navigable with `J`/`K`; a Verdict is allowed once that Participant has submitted, or for anyone once the end date has passed; giving the last missing Verdict closes the Trial Cycle automatically, creates an Offer for _passed with offer_ (Role must still be open, ADR-0001), refreshes Score (ADR-0002) and notifies the Participant. *(src: #19, #9)*
- [ ] **HIRE-06**: A Founder cancels a Trial Cycle before any Verdicts, with no Score consequence for anyone. *(src: #19)*
- [ ] **HIRE-07**: A Participant's private Thread (open from admission until the Trial Cycle closes, then read-only, absent for Applicants) and Founder Announcements are surfaced in the new shell; a Threads list shows a Participant their own Threads and a Founder every Participant's Thread across their Startups' Trial Cycles. *(src: #19 — backend Threads/Announcements already shipped per #10; this covers the new shell's Threads list and review-screen integration)*
- [ ] **HIRE-08**: A Participant is warned that Leaving after the start is public and costs Score, before confirming; an Applicant sees their application's status; a Participant sees their Verdict and Evaluation and chooses whether the Evaluation shows on their profile. *(src: #19)*

### Discover (DISC)

- [ ] **DISC-01**: A visitor or User browses one public Discover page with tabs for Trial Cycles, Startups and Contributors, replacing today's separate Explore and Opportunities; a signed-out visitor is asked to sign in only when pressing Join/Apply; ranking never takes payment into account (ADR-0005). *(src: #19)*
- [ ] **DISC-02**: A Trial Cycle is shown as a card (Startup, title, Role, dates, remaining Capacity, stipend, Join/Apply button); Trial Cycles are searchable and filterable by skills/remote/location; a Startup in Stealth is left out of Discover but still opens from its own link for signed-in Users. *(src: #19, #18)*
- [ ] **DISC-03**: Startups are filterable by category, stage, tech stack, location and remote, and sortable "Most followed"; Contributors are filterable/sortable by Score, skills and location; every result list is bounded to a fixed page size (V1: existing search indexes plus bounded in-memory filtering, no new per-filter indexes). *(src: #2, #18)*
- [ ] **DISC-04**: A Founder browses Contributors with their Score, skills and Proof of Work, and sends an Invite to join their team straight from a Contributor's card or profile; a User hides themself from the Contributors tab; a User follows a Startup from Discover or its Pitch. *(src: #19)*

### Plans & Billing (PLAN)

- [ ] **PLAN-01**: The Plan (Free or Pro) belongs to the Startup, not the User; Free/Pro limits (Trial Cycle Capacity, open Roles, live Trial Cycles, Members, Stealth) are defined once as dependency-free shared constants imported by both the backend and the pricing page; the Free limit on talent's active Trial Cycle entries is removed (existing anti-abuse application/Offer caps stay). *(src: #19)*
- [ ] **PLAN-02**: Limits are enforced only at creation points (creating a Role/Trial Cycle, setting Capacity, sending an Invite, giving a _passed with offer_ Verdict, turning on Stealth); hitting one throws a structured error (limit kind, allowed value, current value) that the UI turns into a same-moment upgrade prompt stating the real numbers; a downgrade never removes or changes anything that already exists, and turning Stealth off is always allowed. *(src: #19)*
- [ ] **PLAN-03**: A Founder upgrades their Startup to Pro monthly or yearly, priced in their local currency (Dodo Adaptive Currency) with UPI and a discount-code field at checkout; the subscription stays with the paying Founder with no handover; every Founder is notified when the Plan changes. *(src: #19)*
- [ ] **PLAN-04**: A Billing screen shows the Startup's Plan, current usage against each limit, and which Founder pays; Pro-only features are shown with a Pro badge rather than hidden. *(src: #19)*
- [ ] **PLAN-05**: A one-off migration moves the Plan from Users to Startups (every Startup starts Free), renames the directory-hiding flag, renames "max contributors" to Capacity, and backfills or drops trial messages that can't be attributed to a Participant. The Focused-Startup field rename is not part of this migration: Phase 1 does it as a plain schema rename with no migration (Phase 1 CONTEXT D-13). *(src: #19)*

### Marketing (MKTG)

- [ ] **MKTG-01**: The landing page leads with "The fast lane for founders", shows real screens of the redesigned product (Trial Cycles, Verdict → Offer, Score, Pitch, Cycles) with no invented logos/testimonials/numbers, and gives students a clear secondary path into Discover. *(src: #19)*
- [ ] **MKTG-02**: The pricing page lists only the limits the backend actually enforces, read from the shared Plan-limits constants (PLAN-01). *(src: #19)*

### Testing (TEST)

- [ ] **TEST-01**: A Playwright suite (dev dependency, run against an isolated local Convex deployment with a seed/reset function and a test-only sign-in, never a shared deployment) covers: sign-in → My Pulses → switch Focused Startup; the full hiring loop (Role → Trial Cycle with a Challenge → Participant joins/submits → Founder reviews with `J`/`K` and gives _passed with offer_ → Participant accepts the Offer in the Inbox); creating a Pulse with `C`, dragging it to review, and a Founder verifying it from the peek panel; a Free Startup hitting a limit and reaching checkout; a signed-out visitor browsing Discover and being asked to sign in only on Join. *(src: #19)*

## Out of Scope

Explicit exclusions carried over from #19's and #2's own "Out of Scope" sections, so re-proposing
them gets a quick "already decided" answer.

| Feature | Reason |
|---------|--------|
| Paid visibility (promoted listings, featured placement, Pro-only outreach) | ADR-0005 rules out selling talent visibility |
| Free Pro trials / "first Trial Cycle at Pro limits" mechanic | Free is kept simple |
| In-app discount/coupon handling beyond the checkout field | Codes are created in the Dodo dashboard, handed out in person |
| Light theme or theme toggle | Dark-only by design |
| Team-based or hackathon-scale Trial Cycles, leaderboards, prizes | Trial Cycles stay small, individual and private (ADR-0003) |
| Billing handover between Founders | Subscription stays with whoever paid |
| Two-key "go to" shortcut chords (e.g. `G` then `I`) | Not in V1 shortcut set |
| Component-level UI tests | Only Playwright e2e coverage on critical flows |
| In-app outreach / direct messaging Founder → Contributor | Share a Trial Cycle link or send a team Invite instead |
| Sending emails of any kind | No email infrastructure in V1 |
| Standalone hackathon-style Trial Cycles without a Role | Every Trial Cycle belongs to a Role (ADR-0001) |
| A `blocked` Pulse state, Pulses outside a Cycle, group chat in Trial Cycles | Superseded by the shipped Pulse/Board model |

## v2 Candidates (deferred, not rejected)

- Pitch analytics (views, follower trends)
- College/graduation-year profile fields; school/work verification via SheerID
- Investor accounts, investor-only Pitch views, fundraising features
- GitHub integration (auto-linking PRs/commits to Pulses) and GitHub verification
- Startup verification, reporting, moderation, anti-gaming beyond Founder verification
- Counting internal Verified Pulses toward Score (revisit once Startup verification exists)
- A success fee per accepted Offer
- A talent-side paid plan
- Native mobile apps

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHELL-01 | Phase 1 | Pending |
| SHELL-02 | Phase 1 | Complete |
| SHELL-03 | Phase 1 | Complete |
| SHELL-04 | Phase 1 | Complete |
| SHELL-05 | Phase 1 | Complete |
| SHELL-06 | Phase 1 | Complete |
| SHELL-07 | Phase 1 | Complete |
| WORK-01 | Phase 2 | Pending |
| WORK-02 | Phase 2 | Pending |
| WORK-03 | Phase 2 | Pending |
| WORK-04 | Phase 2 | Pending |
| TEAM-01 | Phase 3 | Pending |
| TEAM-02 | Phase 3 | Pending |
| TEAM-03 | Phase 3 | Pending |
| TEAM-04 | Phase 3 | Pending |
| TEAM-05 | Phase 3 | Pending |
| TEAM-06 | Phase 3 | Pending |
| TEAM-07 | Phase 3 | Pending |
| HIRE-01 | Phase 4 | Pending |
| HIRE-02 | Phase 4 | Pending |
| HIRE-03 | Phase 4 | Pending |
| HIRE-04 | Phase 4 | Pending |
| HIRE-05 | Phase 4 | Pending |
| HIRE-06 | Phase 4 | Pending |
| HIRE-07 | Phase 4 | Pending |
| HIRE-08 | Phase 4 | Pending |
| DISC-01 | Phase 5 | Pending |
| DISC-02 | Phase 5 | Pending |
| DISC-03 | Phase 5 | Pending |
| DISC-04 | Phase 5 | Pending |
| PLAN-01 | Phase 6 | Pending |
| PLAN-02 | Phase 6 | Pending |
| PLAN-03 | Phase 6 | Pending |
| PLAN-04 | Phase 6 | Pending |
| PLAN-05 | Phase 6 | Pending |
| MKTG-01 | Phase 6 | Pending |
| MKTG-02 | Phase 6 | Pending |
| TEST-01 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-28*
*Last updated: 2026-09-28 after initial roadmap creation (new-project-from-ingest)*
