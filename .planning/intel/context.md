# Context

Synthesized from `CONTEXT.md`, the domain glossary (classified type: DOC). Content is appended verbatim by topic section, with the definition and its `_Avoid_` list (naming constraints for code/UI) preserved as written.

## People
- source: CONTEXT.md

**User**: Anyone signed in (Google sign-in, no onboarding; the profile is completed later).

**Contributor**: UI-only word for a User as shown in Discover and on profiles. In the domain, a Contributor is a Member of a Startup or a Participant in a Trial Cycle.
_Avoid in code_: use Member or Participant

**Inbox**: Where a User receives everything addressed to them: notifications, Offers and Invites. Offers and Invites are answered in place.
_Avoid_: Notifications page, bell

## Startups and teams
- source: CONTEXT.md

**Startup**: A company on Engin, owned by one or more Founders.
_Avoid_: Company, project, workspace

**Focused Startup**: The one Startup a User has open at a time, among those they belong to; they switch between them. Inbox, My Pulses and Threads are never limited to it.
_Avoid_: Active startup, current workspace

**Founder**: A Startup team member with authority to create Cycles and manage their Cycle Members, verify Pulses, create Roles and Trial Cycles, give Verdicts, and make Offers. A Startup can have several Founders with equal powers.
_Avoid_: Owner, admin

**Member**: A non-founder on a Startup's team, joined either by accepting an Offer or by Invite.
_Avoid_: Employee, teammate

**Invite**: A Founder's direct invitation for someone to become a Member (or a Founder), bypassing Trial Cycles. Addressed by username or email; it appears in the invitee's notifications and is accepted in-app. An Invite to an email with no account yet is linked when that email signs up. Expires after a fixed period; re-inviting refreshes the pending Invite.
_Avoid_: Invitation link

**Pitch**: A Startup's public page: fixed, optional sections (problem, solution, product, traction, team, links, media) plus its open Roles, Trial Cycles and, if the Founders choose, Public Stats. Visible without login unless the Startup is in Stealth; actions and deeper details require login.
_Avoid_: Pitch deck, landing page

**Stealth**: A Startup hidden from everyone outside its team: no public Pitch and no listing in Discover. A Pro feature. A Startup is never taken out of Stealth automatically.
_Avoid_: Private startup, hidden

**Public Stats**: Headline execution numbers shown on a Pitch: team size, Verified Pulses in the last 30 days, Cycles completed, Trial Cycles run, and hires from Trial Cycles.

**Follow**: A User following a Startup. The only "like/star" mechanism; follower count drives sorting in Discover.
_Avoid_: Star, like

**Discover**: The public place to browse open Trial Cycles, Startups and Contributors. It is ranked on merit only: nobody can pay to be listed higher.
_Avoid_: Explore, Opportunities

## Hiring
- source: CONTEXT.md

**Role**: A listing for a position at a Startup, with a Headcount. People cannot apply to a Role directly; they enter through one of its Trial Cycles.
_Avoid_: Opening, job, position

**Headcount**: The number of accepted Offers after which a Role is filled and closes.
_Avoid_: Seats, slots

**Trial Cycle**: A time-boxed period of real work for a Role, in which each Participant works on their own Board and receives a Verdict at the end. Every Trial Cycle belongs to a Role.
_Avoid_: Trial, tryout, test project, hackathon

**Admission**: How people enter a Trial Cycle: _open_ (join directly, first come first served) or _application_ (a Founder picks from Applicants).

**Capacity**: The most Participants a Trial Cycle admits. Founders set it, up to their Plan's limit.
_Avoid_: Seats, slots, max contributors

**Applicant**: Someone who has applied to an application-admission Trial Cycle and is awaiting a decision.
_Avoid_: Candidate

**Participant**: Someone currently taking part in a Trial Cycle.
_Avoid_: Trialist

**Challenge**: A template Pulse a Founder defines on a Trial Cycle. When the Trial Cycle starts (or when a Challenge is added later), each Participant gets their own copy on their Board. Copies belong to the Participant; editing the Challenge never changes them.
_Avoid_: Task, brief

**Board**: A Participant's private kanban inside a Trial Cycle, seen only by that Participant and the Startup's Founders. The Participant owns it: they split, edit, add and move its Pulses (_todo → in progress → done_) themselves.
_Avoid_: Workspace

**Submission**: A Participant's final summary and Proof Links for a Trial Cycle. It can be overwritten until the end date; a Verdict or the end date locks it together with the Board.

**Announcement**: A one-way message from the Founders to all Participants of a Trial Cycle.

**Thread**: The private conversation between one Participant and the Startup's Founders in a Trial Cycle. Open from admission until the Trial Cycle closes, then read-only. Applicants have no Thread.
_Avoid_: Chat room

**Leaving**: A Participant exiting a Trial Cycle after it has started. It is public on their profile and costs Score. Exiting before the start is not Leaving.
_Avoid_: Dropping out, quitting

**Cancellation**: Ending a Trial Cycle without Verdicts — by a Founder, automatically when nobody joined by the start, or when its Role fills before it starts. Carries no Score consequence.
_Avoid_: Abort

**Verdict**: A Founder's judgement of one Participant: _passed with offer_, _passed_, or _not passed_. It can be given once the Participant has submitted, or to anyone after the end date; a Trial Cycle closes when every Participant has one.
_Avoid_: Result, grade, decision

**Evaluation**: An optional written assessment accompanying a Verdict, private to the Participant unless they choose to show it on their profile.
_Avoid_: Review, feedback

**Offer**: An invitation to become a Member, created by a _passed with offer_ Verdict. It stays pending until the Participant accepts or declines it, or the Founder withdraws it. Accepting it is the hire.
_Avoid_: Hire, acceptance

## Work
- source: CONTEXT.md

**Cycle**: A Startup's internal time-boxed period of work, with a name, start and end date. Starts automatically at its start date; Founders close it. Unfinished Pulses can be moved to another Cycle on close.
_Avoid_: Sprint, iteration

**Cycle Member**: A Member added to a Cycle by a Founder. Members see only Cycles they are Cycle Members of; Founders implicitly belong to every Cycle. Being added notifies, no acceptance needed.

**Pulse**: A single unit of work, on a Cycle's kanban or a Participant's Board. Every internal Pulse belongs to a Cycle. Cycle kanban: _todo → in progress → review → done_.
_Avoid_: Task, ticket, issue

**My Pulses**: Every Pulse a User is working on, across all their Startups and Trial Cycles: Cycle Pulses assigned to them plus the Pulses on their Boards.
_Avoid_: My work, my tasks

**Proof Link**: A typed link attached to a Pulse or Submission as evidence of work: _pr, commit, deploy, design, doc, demo, other_. Optional on Pulses; a Submission needs at least one.
_Avoid_: Evidence URL

**Submitted Pulse**: An internal Pulse in _review_, awaiting a Founder. Its assignee cannot move it; a Founder verifies it or sends it back to _in progress_ with a note.

**Verified Pulse**: An internal Pulse a Founder has moved from review to done. Every internal Pulse passes through review, including a Founder's own.
_Avoid_: Completed pulse

## Reputation
- source: CONTEXT.md

**Score**: A person's public reputation number, derived only from Trial Cycle outcomes: passed Verdicts and accepted Offers, minus Leaving. Internal work does not change Score.
_Avoid_: Engin score, rating, karma

**Proof of Work**: The execution history behind a profile: Verified Pulses and Cycles completed per Startup, Trial Cycles, Verdicts and Offers. For Startups in Stealth, only aggregate counts are shown.

**Activity**: An append-only record of Startup events (member joined, Cycle started/closed, Pulse verified, Role posted…). Founders see all of it; Members see Startup-wide events plus those from their Cycles. The raw material for Public Stats and, later, investor-facing execution signals.
_Avoid_: Log, feed (in code)

## Plans
- source: CONTEXT.md

**Plan**: What a Startup pays for: _Free_ or _Pro_. A Plan only limits what a Startup can do. Everything a person does as talent (finding and joining Trial Cycles, building Score, their profile) is free, whatever Plan any Startup is on.
_Avoid_: Subscription tier, account type, "Pro user"
