# Phase 1: Hiring Screen & Drafts - Research

**Researched:** 2026-10-04
**Domain:** Brownfield React 19 + TanStack Router SPA on Convex. Founder hiring screen, Role create/close, draft hackathon (Trial Cycle) create/edit/reschedule/cancel, and removing open-join admission.
**Confidence:** HIGH (nearly everything was checked against the repo this session; no new libraries)

## Summary

The backend already does most of Phase 1. `roles.list/create/close`, `trialCycles.list/get/create/reschedule/cancel` and `challenges.add/remove/list` all exist, are founder-guarded where they should be, and are covered by 168 passing tests (19 files, about 12s). Phase 1 needs four backend changes:
1. A new draft-only `trialCycles.update` mutation (D-07).
2. Three "More details" fields on `trialCycles`. They don't exist yet: `expectedOutcome`, `evaluationCriteria`, `compensation`.
3. The D-23 close guard in `roles.close`.
4. Removing `admission` / `joinTrial` (D-11).

D-11 is the biggest change by line count. `joinTrial` appears 30 times across 7 test files and the `startedTrialWith` fixture, so every one of those tests has to move to "apply, then the founder admits".

The frontend starts almost from scratch. `/s/$slug/hiring` is a `StubScreen`. Two orphaned components (`WorkspaceRoles.tsx`, `WorkspaceTrials.tsx`) show the old list markup, but they call `useQuery` inside components, which breaks the project rule, and nothing imports them. Delete them and rebuild under `src/features/hiring/`. The repo has no form library, and PROJECT.md forbids adding one. The house pattern is `useState` in a feature hook, a zod schema in `schemas/`, `validate()` from `~/lib/validation`, and `toast.error(toErrorMessage(...))`. The shadcn components Phase 1 needs (field, empty, alert-dialog, select, collapsible, spinner) depend only on `radix-ui`, `cn` and `class-variance-authority`, which are all installed already, so no new npm packages are needed.

**Primary recommendation:** Build one shared hackathon form, used for both create and edit. Back it with an atomic `create`/`update` pair that also writes the Starting Pulses (challenges) in the same mutation. Put the shared schedule and field rules in `trialCycles.rules.ts`. Use `datetime-local` inputs, not date-only ones. Ship no publish or credit UI in Phase 1, but leave clean slots for Phase 2: an `intent` on the form's submit handler, a header slot for the credit badge, and a consequence-text prop on the cancel dialog.

## Phase 1 vs later-phase seams (read first)

| Phase 1 element | Touches later phase | What Phase 1 ships |
|---|---|---|
| D-03 "Unpublished: Publish / Edit / Cancel" row actions | Publish dialog (HIRE-06, Phase 2) | **Edit + Cancel only.** Leave room in the row's action group for Publish. Nobody can publish in Phase 1 anyway: founders get no credits until the Phase 2 signup credit, and launch codes are being removed (D-20). |
| D-08 "Continue to publish" (primary) + "Save for later" (secondary) | Publish dialog (Phase 2) | Make the form's submit `onSubmit(intent: "save" \| "publish")`. Phase 1 renders **one** button that saves and returns to `/s/$slug/hiring`. Label it **"Save for later"** so the copy doesn't change when Phase 2 adds "Continue to publish" as the primary. |
| D-04 "Your first hackathon is on us" | Signup credit + balance (HIRE-04/05, Phase 2) | The empty state says "Run your first hiring hackathon" with one button. **No free-credit line and no `credits.balance` read.** Phase 2 adds the conditional line. |
| D-01 credit badge in the page header | HIRE-04 (Phase 2) | Leave an empty right-hand slot in the page header (e.g. a `headerAside?: ReactNode` prop on the page layout). Don't read credits. |
| D-15 shared date-fields component | Dates-passed fix inside the publish dialog (Phase 2) | Build `TrialScheduleFields` as a **standalone controlled component** (value + onChange + disabled + error), with no Convex calls inside, so the Phase 2 dialog can drop it in and save through `reschedule`. |
| D-22 cancel refund and confirm copy | Phase 2 | `CancelHackathonDialog` takes a `consequence?: string` prop. Phase 1 copy is status-based with no credit wording (see Code Examples). Keep the cancel logic in `cancelTrial` (rules) so Phase 2 can add the refund in the endpoint. Note that `offers.rules.ts` also cancels `open` trials when a Role fills, so Phase 2's refund must cover that path too. |
| D-12 "At least one Starting Pulse is required to publish" | Publish gate (Phase 2) | **Don't add the publish gate in Phase 1** (see Pitfall 6: it breaks the count-sensitive challenge tests). Phase 1 allows saving a draft with zero Starting Pulses and shows a hint. Phase 2 adds the `publishProblem` check and a client-side check on "Continue to publish". |
| D-17 "Confirming payment…" banner | Phase 3 | Nothing. Grouping rows by `status` is enough for Phase 3 to add a banner on draft rows that have `ipAcknowledgedAt` set. |
| D-11 open-join removal makes "full" an accept-time error only | PUBL-04 (Phase 5) | Nothing beyond the removal. Note for Phase 5: `applyToTrial` doesn't reject when the trial is full. Only `decide` → `takeParticipantSpot` throws "This Trial Cycle is full". |

<user_constraints>
## User Constraints (from CONTEXT.md)

> CONTEXT.md is shared by Phases 1–3: "Plan only the decisions that belong to the phase being planned." The phase-1-owned decisions are D-01 (except the credit badge), D-03, D-04 (except the free copy), D-05, D-06, D-07, D-08 (save path), D-09, D-10, D-11, D-12, D-23. D-02, D-13..D-22 and D-24 belong to Phases 2–3 and are copied below for seam awareness only.

### Locked Decisions

#### Hiring screen layout
- **D-01:** Two tabs, **Hackathons | Roles**, with Hackathons as the default. The credit count is a small badge in the page header, visible on both tabs. Hackathons are grouped by status: Unpublished (draft) → Open → Running → Closed/Cancelled. Roles list open Roles, each with Close. It must work at phone width.
- **D-02:** Credits show as a **count only** ("2 hackathon credits"), with no per-credit source/expiry breakdown and **no code input anywhere in the app**. The data comes from `api.billing.credits.balance`.
- **D-03:** Hackathon rows act according to their status:
  - every row shows title, Role, dates, status badge and participant count
  - Unpublished: Publish / Edit / Cancel
  - Open or Running: a link to `/s/$slug/trials/$trialCycleId` (Phases 7–9; it may land on its stub for now) and Cancel where the backend allows it
  - Closed or Cancelled: read-only
- **D-04:** The empty state is a guided first step, "Run your first hiring hackathon". One button opens the new-hackathon page with "+ New Role" ready. When the founder has their free signup credit, the copy says the first hackathon is free ("Your first hackathon is on us"). Never mention codes.
- **D-05:** Non-founder members see both tabs **read-only**: no credit badge and no actions. The backend `list` queries already allow members, and every mutation stays founder-guarded.

#### Creating and editing a hackathon
- **D-06:** Hackathons are created on a full page, `/s/$slug/hiring/new`, with a thin route file and the page in `src/features/hiring/...`. Not a dialog.
- **D-07:** The **same form** edits an unpublished hackathon at `/s/$slug/hiring/$trialCycleId/edit`, prefilled. This needs a new founder-guarded, **draft-only** `trialCycles.update` mutation covering title, description, Role, dates, deadline, max participants, prize and the More-details fields. After publishing, only Pulses/challenges can change, as today. In the UI a "draft" is called **unpublished**: it's saved, private, and not paid for.
- **D-08:** The form's primary button is **"Continue to publish"**. It saves, then opens the publish dialog straight away. A secondary "Save for later" saves and returns to the Hiring screen. Saving before checkout means nothing is lost if payment fails or the founder leaves (conversion).
- **D-09:** A Role picker sits at the top of the form and lists open Roles, with "+ New Role" inline: title, type (`ROLE_TYPES`), skills, short description, headcount defaulting to 1. Creating a Role selects it.
- **D-10:** Fields:
  - Essentials, always visible: title, description, max participants (backend clamps to `MAX_TRIAL_PARTICIPANTS`, 10), start and end, optional application deadline, optional prize (free text), starting Pulses.
  - Collapsed under "More details": expected outcome, evaluation criteria, compensation.
  - **No admission choice** (D-11).
- **D-11:** **Application only.** Remove the `admission` field / `trialAdmission` validator and the open-join path from the backend entirely: schema, `trialCycles.create`, `applications` join logic, `opportunities`, helpers, tests, and the frontend readers (`ApplyButtons.tsx`, `ParticipantTrialActions.tsx`, `PublicOpenings.tsx`). Every entrant applies and the founder admits. There's no data, so there's no migration. — **Reversibility:** costly — bringing open join back touches schema, applications and three UI components.
- **D-12:** Challenges are presented as **"Starting Pulses"**, to match internal Cycles. The form section reuses the look of the Cycle pulse-add UI: a list of title + optional description. At least one is required to publish. When the hackathon starts, the backend already seeds each one as a `todo` Pulse on every participant's board (`seedBoards` in `convex/hiring/challenges.rules.ts`). The table stays `challenges` internally; only user-facing copy changes. Seed them atomically with create/update if simple, otherwise call `challenges.add` per item (planner decides). They stay editable while the hackathon is unpublished or open.

#### Publish & blocked states
- **D-13:** Errors appear **only after the click**, with no pre-check query. The publish dialog calls the mutation and shows the backend's thrown message verbatim, adding a fix action only where one exists (D-15).
- **D-14:** One publish dialog adapts to the founder's balance:
  - The required IP acknowledgment tick (founder side of the IP terms) is at the top. This replaces any `window.confirm`-style prompt.
  - With a credit, the button reads "Publish (uses 1 credit, N left)". When the only credit is the signup one, it reads "Publish, uses your free credit". It calls `trialCycles.publish({ acceptTerms: true })`, and the UI guards against double-submit.
  - With no credit, the main button reads "Pay ₹2,999" (Free plan) or "Pay ₹1,499" (Pro top-up) and calls `billing.checkout.createHackathonCheckout`, then redirects. A Free founder also sees a **Go Pro option**: "or go Pro, ₹999/month: hackathons at ₹1,499 + a bigger workspace", which starts the Pro checkout through the existing upgrade path (`useUpgrade`). No code field.
- **D-15:** Fixes after a failed click:
  - **Stealth:** show the backend message only, with no inline "Turn off stealth" button. Accepted gap: until Phase 13 Settings ships, there's no in-app stealth toggle.
  - **Dates passed** (`NEW_DATES_MESSAGE`): date fields (start/end/deadline) appear **inside the publish dialog** and save through `reschedule` (or the D-07 `update`). Then Publish is enabled. One shared date-fields component serves the form and the dialog.
  - Role closed: message only. This can't happen once D-22 is in place, but the message stays.

#### Return from checkout
- **D-16:** Dodo's `returnUrl` is the plain Hiring screen, `${origin}/s/$slug/hiring`, with no query param. The UI never treats the redirect as proof of payment. State always comes from Convex.
- **D-17:** "Checkout in progress" is detected from backend state. `prepareHackathonCheckout` sets `ipAcknowledgedAt` on the draft before taking money. An unpublished hackathon with `ipAcknowledgedAt` set shows a live "Confirming payment… this publishes automatically" banner, which flips to "Live!" when the status becomes `open`. It works even if the tab was closed (HIRE-08).
- **D-18:** **Simple version**, with no soft timeout and no "No payment yet" state. If the payment lands after the dates passed (HIRE-10), the credit shows in the balance and the hackathon stays unpublished. The founder clicks Publish, gets the dates message, and fixes it in the dialog (D-15). The banner may simply drop once the credit is in the balance and the trial is still a draft (planner's call on the exact condition).

#### Credits & pricing model (backend changes)
- **D-19:** **Signup credit:** every new account gets 1 free hackathon credit when it is created, with **no expiry**. Add a new credit source (e.g. `signup`) with grant key `signup:{userId}` so it's idempotent. Hook the grant into user creation: `convex/auth.ts` has no callback today, so add `callbacks.afterUserCreatedOrUpdated` (or equivalent) that grants only on creation. The multi-Google-account abuse risk is accepted for now. — **Reversibility:** one-way — once founders have received free credits, taking the offer back is a public pricing change.
- **D-20:** **Remove launch/UPI codes completely:** `claimLaunchCode`, `createLaunchCode`, their table/schema, the `launch`/`upi` credit sources, tests and the CLAUDE.md operator line. HIRE-05 becomes "every new founder account starts with 1 free credit, shown in the balance". Pro discount codes live in Dodo (the user's go-to-market plan, not app work). `grantRerunCredit` stays as the only operator grant.
- **D-21:** **Pro is a workspace plan with no included hackathon credits.** Every hackathon is paid per run: ₹2,999 on Free, ₹1,499 on Pro (Dodo products already split this way). Pro keeps its `PLAN_LIMITS` perks (capacity, unlimited open Roles, members, stealth). Remove the monthly Pro credit machinery: the `pro_monthly` credit source, `grantMonthlyProCredits` and its cron/daily job, `MAX_BANKED_PRO_CREDITS`, `MAX_PRO_USERS_SCAN` (if unused after), `expireProCredits` / the resubscribe un-expire logic and their webhook calls, and their tests. Credits that were bought (`purchase`), the signup credit, and `rerun` credits never expire on cancel. Cancelling Pro only drops the workspace back to Free limits (nothing is deleted; adding beyond Free is blocked) and the hackathon price back to ₹2,999. The rule to show users: "Your first hackathon is free. After that ₹2,999 each, or ₹1,499 on Pro." The **pricing page (Phase 6, PUBL-06) must say this.** Why: with included credits, a founder can pay ₹999 for one month, run the hackathons and cancel, so nobody would ever buy the ₹2,999 single. — **Reversibility:** one-way — once Pro is sold with no included credits, adding credits later is fine, but removing them after promising them would be a public pricing change.
- **D-22:** **Cancel refunds the credit before the start.** Cancelling an **open** hackathon (published, not yet started) returns the credit that paid for it. Cancelling a **running** one does not. Cancelling an unpublished one costs nothing. The cancel confirm states which case applies ("Your credit will be returned" or "Cancelling won't return your credit"). The planner chooses how to refund: re-grant the same source with its original expiry, or un-spend the credit row, keyed so it can't refund twice.
- **D-23:** **Closing a Role is blocked** while it has an unpublished, open or running hackathon: "Cancel this Role's hackathons first." Change `roles.close` and add a test.

#### OPS-01
- **D-24:** Creating the Dodo products (Pro monthly ₹999, Pro yearly ₹9,999, Hackathon ₹2,999, Hackathon for Pro ₹1,499) and setting `DODO_MONTHLY_PLAN_ID`, `DODO_YEARLY_PLAN_ID`, `DODO_HACKATHON_PRODUCT_ID` and `DODO_HACKATHON_PRO_PRODUCT_ID` is a manual task for the user. The plan includes a `checkpoint:human-action` with exact click-by-click steps, test mode first, and doesn't try to automate it. The user isn't fluent in ops terms, so write the steps plainly.

### Claude's Discretion
- Copy, the exact banner placement (row vs top of screen) and the drop condition for the banner (D-18).
- Whether challenge seeding is atomic (D-12), and the refund mechanism (D-22).
- Component breakdown and the form/validation approach, following existing `src/features/hiring/*` patterns.

### Deferred Ideas (OUT OF SCOPE)
- Inline "Turn off stealth" in the publish dialog: not chosen. Stealth is handled by Phase 13 Settings (TEAM-03).
- Soft-timeout / "No payment yet" checkout banners: not chosen (simple version). Revisit if founders get confused.
- Reading Dodo's return-URL status for an instant "Payment cancelled": not chosen.
- The pricing page must explain the model (first hackathon free, then ₹2,999 each or ₹1,499 on Pro, Pro = bigger workspace + stealth): Phase 6, PUBL-06/07.
- Pro discount codes: in the Dodo dashboard, part of the go-to-market plan, not app work.
- **No direct founder↔participant DMs** (decided 2026-10-04): founders only post announcements to all participants. This changes RUN-04 (Phase 8: drop private per-participant threads, keep announcements) and TEAM-06 (Phase 14: Threads likely shrinks to announcements). Settle the details in Phase 8 discuss. It doesn't touch Phases 1–3.
- No admin `grantCredit` command (UPI payers / incubator packs): declined. Every paid hackathon goes through Dodo, and `grantRerunCredit` stays.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HIRE-01 | Founder sees the Startup's Roles and Trial Cycles (draft, open, running, closed, cancelled) on the Hiring screen | `roles.list` and `trialCycles.list` exist and are member-readable (`requireMembership`). Group client-side by `trialStatus`. Read-only for members via `useStartupRoute().member.role`. See Pattern 1. |
| HIRE-02 | Founder can create and close a Role | `roles.create` / `roles.close` exist. Add the D-23 guard via a new `convex/hiring/roles.rules.ts` → `requireNoLiveHackathons` using the `by_role` index + `MAX_ROLE_TRIALS`. Inline "+ New Role" on the form (D-09). See Pattern 4. |
| HIRE-03 | Founder can create a draft Trial Cycle for a Role with dates, ~~admission mode~~ (application-only per D-11), optional application deadline, optional prize and seeded challenges | `trialCycles.create` exists. Extend it with `challenges[]` + More-details fields and remove `admission`. Add `trialCycles.update` (draft-only). Shared rules in `trialCycles.rules.ts`. See Patterns 2, 3, 5. Update the HIRE-03 text in REQUIREMENTS.md to drop "admission mode". |
| HIRE-09 | Founder can reschedule a draft's dates and cancel a draft or published Trial Cycle | `reschedule` (draft-only) and `cancel` (draft/open/active) exist and are tested. Phase 1 surfaces rescheduling through the Edit page (dates are in the form) and keeps `reschedule` for the Phase 2 dialog. Cancel uses an AlertDialog. Share schedule validation between create/update/reschedule. |
</phase_requirements>

## Project Constraints (from CLAUDE.md and PROJECT.md)

- pnpm. `pnpm test` (vitest, `convex/**/*.test.ts` only), `pnpm check` (biome lint+format --write, then `tsc --noEmit`). No frontend tests. [VERIFIED: CLAUDE.md, vitest.config.ts]
- Endpoint files export only Convex functions, in this order: queries, mutations, internal. Private logic goes in `*.rules.ts`, named after the endpoint file (so `roles.rules.ts` for `roles.ts`). [VERIFIED: CLAUDE.md]
- Every handler starts with `requireUserId(ctx)`, then an access guard. Guards throw plain `Error`s with user-facing messages. Naming: `require*` throws, `load*`/`get*` return data or null, `build*`/`parse*`/`normalize*` are pure. [VERIFIED: CLAUDE.md]
- Every read is bounded: `.take(N)` with constants from `lib/limits.ts`, never `.collect()`. Validate text with `limitText`/`normalizeTags` (`lib/text.ts`). [VERIFIED: CLAUDE.md]
- Mutations with side effects call `notify`/`notifyFounders` and `logActivity` together at the same sites. [VERIFIED: CLAUDE.md]
- Tables and enum validators live in `<domain>/<domain>.schema.ts`. Import validators from `schema`. No migrations or legacy fields: change the schema directly. [VERIFIED: CLAUDE.md, memory]
- Trial Cycles start as `draft` and go public only through `hiring.trialCycles.publish`. [VERIFIED: CLAUDE.md]
- Tests sit next to their module (`foo.<topic>.test.ts` for several files). Fixtures live in `<module>.helpers.ts`. Fixtures needing a Startup take `setup`. Tests already run on fake timers, so don't add `vi.useFakeTimers()`. Use `describe` in files with about 10+ tests. Name tests by behaviour, separate arrange/act/assert with blank lines, assert through the public API. [VERIFIED: CLAUDE.md]
- Frontend: `~` → `src`, `@convex` → `convex`. Route files stay thin and render pages from `src/features/<domain>/<area>/`. `useQuery`/`useMutation` live in feature hooks, not components; pass `"skip"` when args aren't ready. The frontend may import plain constants from a rules file, never server code. [VERIFIED: CLAUDE.md]
- PROJECT.md: **no new libraries without approval** (except dnd-kit). Every screen works at phone width. Backend errors are shown word for word. Prices are in INR. [VERIFIED: .planning/PROJECT.md Constraints]
- Follow `convex/_generated/ai/guidelines.md`. [VERIFIED: CLAUDE.md]
- Project skill `.claude/skills/shadcn`: forms use `FieldGroup` + `Field`. Empty states use `Empty`. Callouts use `Alert`. Use `gap-*`, not `space-y-*`. Dialogs need a Title. Buttons have no `isLoading`, so compose `Spinner` + `disabled`. Use `toast()` from `sonner` (Radix project). Option sets of 2–7 choices use `ToggleGroup`. [VERIFIED: .claude/skills/shadcn/SKILL.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Founder-only actions (create/update/cancel trial, create/close Role) | API / Backend (Convex mutations) | Browser (hide buttons for members) | Guards (`requireFounderMembership`) are the security boundary. UI hiding is UX only (D-05). |
| Draft-only edit rule, schedule validation, Role-belongs-to-startup check | API / Backend (`trialCycles.rules.ts`) | Browser (zod pre-check for fast feedback) | The backend is the source of truth. Client zod only gives inline messages. |
| Role close guard (D-23) | API / Backend (`roles.rules.ts`) | — | Must hold even if the UI is bypassed. |
| Starting Pulses persistence | API / Backend (atomic in create/update) | — | One transaction. No half-saved drafts. |
| Grouping by status, tab state, read-only rendering | Browser / Client | — | Pure presentation over `trialCycles.list` / `roles.list`. |
| Date entry and timezone conversion | Browser / Client (`src/lib/dates.ts`) | Backend stores epoch ms | The founder's local time becomes epoch ms on the client. The backend compares against `Date.now()`. |
| Draft visibility (nowhere public) | API / Backend (`get` returns null for non-members; `opportunities`/`listOpenByStartup` read `status: "open"` only) | — | Already true. Phase 1 must not add any public read of drafts. |
| Data storage | Database (Convex `trialCycles`, `challenges`, `roles`) | — | Schema change: drop `admission`, add 3 optional detail fields. |

## Standard Stack

All of these are already installed. Phase 1 adds no npm packages. [VERIFIED: package.json read this session]

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | 1.46.0 | Backend queries and mutations, schema | Project backend |
| convex-test | 0.0.60 | Backend tests (`createTest()` in `lib/testing.helpers.ts`) | Existing test harness |
| @tanstack/react-router (+ router-plugin) | 1.170.38 / 1.168.40 | File-based routes; the plugin regenerates `src/routeTree.gen.ts` on `vite dev`/`vite build` | Project router |
| react | 19.2.0 | UI | — |
| zod | 4.6.5 | Client-side form schemas (`src/features/*/schemas/*.ts`) + `validate()` | Existing form pattern |
| radix-ui | 1.6.7 | Primitives behind shadcn (exports AlertDialog, Select, Collapsible, Checkbox, RadioGroup, Popover) | Already used by `tabs.tsx`, `dialog.tsx` |
| sonner | 2.0.8 | Toasts for mutation errors | Existing pattern |
| lucide-react | 1.46.0 | Icons | Existing |

### shadcn components to add (source files, not packages)
| Component | Command | Deps (checked with `pnpm dlx shadcn@latest view`) | Use |
|---|---|---|---|
| field | `pnpm ui field` | cn; registry: label, separator (both present) | Form layout (`FieldGroup`/`Field`/`FieldLabel`/`FieldDescription`/`FieldError`) |
| empty | `pnpm ui empty` | cn | D-04 empty state |
| alert-dialog | `pnpm ui alert-dialog` | cn, radix-ui; registry: button | Cancel-hackathon confirm |
| select | `pnpm ui select` | cn, radix-ui | Role picker, Role type |
| collapsible | `pnpm ui collapsible` | radix-ui | "More details" section |
| spinner | `pnpm ui spinner` | cn, class-variance-authority | Pending buttons |
| (optional) toggle-group, alert | `pnpm ui toggle-group alert` | radix-ui / cn | Role type as chips; inline notices |

Existing: badge, button, card, dialog, input, label, separator, skeleton, sonner, tabs, textarea, tooltip, sheet, dropdown-menu. [VERIFIED: `ls src/components/ui`]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState + zod + `validate()` | react-hook-form / TanStack Form | Not installed. PROJECT.md says no new libraries without approval. The existing forms (`useCycleForm`, `useCreateStartupWizard`) use useState. |
| `<input type="datetime-local">` | shadcn Calendar/date-picker | Calendar pulls `react-day-picker` + `date-fns` (new deps, needs approval). Native input works on phones. |
| Atomic challenges in create/update | `challenges.add` per item after create | Per-item calls can half-save on a failure and need diffing on edit. Atomic replace is simpler (see Pattern 3). |

**Installation:** none (npm). Components: `pnpm ui field empty alert-dialog select collapsible spinner`

## Package Legitimacy Audit

No external packages are installed in this phase. The shadcn components are copied source files whose only runtime deps (`radix-ui`, `class-variance-authority`) are already in `package.json`. [VERIFIED: `pnpm dlx shadcn@latest view` output this session]

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Founder / Member (phone or desktop)
        │
        ▼
/s/$slug/hiring ──(MemberGate: member? else → /startup/$slug)
        │  useStartupRoute() → { startup._id, role: "founder"|"member" }
        ▼
HiringPage  [Tabs: Hackathons | Roles]   headerAside slot (Phase 2 credit badge)
   │                     │
   │ useHiringScreen     │ useRoles
   │  └ useQuery(trialCycles.list)      └ useQuery(roles.list) / useMutation(roles.close)
   ▼                     ▼
group by status:         open Roles (+Close if founder)
 draft→Unpublished        └─ roles.close ──► requireNoLiveHackathons ──► throw "Cancel this Role's hackathons first."
 open→Open                                   (by_role index, draft/open/active)
 active→Running
 closed/cancelled
   │
   ├─ Unpublished row: [Edit] → /s/$slug/hiring/$id/edit     [Cancel] → AlertDialog → trialCycles.cancel
   ├─ Open/Running row: link → /s/$slug/trials/$id (stub)    [Cancel] → AlertDialog → trialCycles.cancel
   └─ Closed/Cancelled: read-only
   │
   └─ "New hackathon" / empty-state CTA → /s/$slug/hiring/new
                                   │
                                   ▼
             HackathonFormPage (mode: create | edit)
               RolePicker (+ New Role inline → roles.create → select)
               Essentials: title, description, max participants
               TrialScheduleFields (start, end, deadline)  ◄── reused by the Phase 2 publish dialog
               Prize, StartingPulsesField (list of {title, description?})
               More details (Collapsible): expected outcome, evaluation criteria, compensation
               zod validate → onSubmit(intent)
                   │ create: trialCycles.create({..., challenges})   ──► insert draft + challenges (one txn)
                   │ edit:   trialCycles.update({..., challenges})   ──► require draft, patch, replace challenges
                   ▼
             navigate → /s/$slug/hiring  (Phase 2: intent "publish" opens the dialog instead)
```

### Recommended Project Structure

```
convex/hiring/
├── hiring.schema.ts          # drop trialAdmission + admission; add expectedOutcome/evaluationCriteria/compensation
├── trialCycles.ts            # create (+challenges, details, no admission), NEW update; publish/reschedule/cancel unchanged
├── trialCycles.rules.ts      # NEW requireOpenRoleOf, requireValidSchedule, buildTrialFields
├── trialCycles.helpers.ts    # drop admission override; add challenges override + enterTrial(setup, id, person)
├── trialCycles.drafts.test.ts# NEW: create/update/schedule/visibility tests
├── challenges.rules.ts       # NEW replaceChallenges(ctx, trial, items, userId) + buildChallengeFields
├── roles.ts                  # close → requireNoLiveHackathons
├── roles.rules.ts            # NEW requireNoLiveHackathons (+ move parseSkills here)
├── applications.ts           # delete joinTrial; drop admission check in applyToTrial
└── opportunities.ts          # drop `admission` from trial cards
convex/lib/limits.ts          # NEW text bounds for trial/challenge fields
convex/lib/text.ts            # (optional) requireLimitedText(value, field, max)

src/routes/_shell/_authed/s/$slug/_member/hiring/
├── index.tsx                 # → HiringPage
├── new.tsx                   # → HackathonFormPage mode="create"
└── $trialCycleId/edit.tsx    # → HackathonFormPage mode="edit"

src/features/hiring/
├── screen/
│   ├── pages/HiringPage.tsx
│   ├── components/{HackathonsTab,HackathonRow,RolesTab,RoleRow,HiringEmptyState}.tsx
│   └── hooks/useHiringScreen.ts
├── roles/
│   ├── constants.ts          # ROLE_TYPES (exists)
│   ├── components/NewRoleForm.tsx
│   ├── hooks/useRoles.ts     # list + create + close
│   └── schemas/role.ts
└── trialCycles/
    ├── constants.ts          # add TRIAL_STATUS_GROUPS / labels (exists; keep VERDICTS etc.)
    ├── pages/HackathonFormPage.tsx
    ├── components/{HackathonForm,RolePicker,TrialScheduleFields,StartingPulsesField,CancelHackathonDialog}.tsx
    ├── hooks/{useHackathonForm,useHackathonDraft,useCancelHackathon}.ts
    └── schemas/hackathon.ts
src/lib/dates.ts              # add fromDateTimeInput / toDateTimeInput (local time)
src/shell/nav.ts              # add SCREEN_TITLES for the two new route ids
```

Delete: `src/features/teams/startup/workspace/components/WorkspaceRoles.tsx` and `WorkspaceTrials.tsx`. Nothing imports them (grep this session), and they call `useQuery` in components. [VERIFIED: grep]

### Pattern 1: Hiring screen data and grouping (HIRE-01, D-01, D-05)
**What:** two member-readable queries, grouped client-side.
**Source facts:**
- `trialStatus` is [VERIFIED: convex/hiring/hiring.schema.ts:10-17]:
  ```
  export const trialStatus = v.union(
  	/** Created but not paid for: hidden, not joinable, no start scheduled. */
  	v.literal("draft"),
  	v.literal("open"),
  	v.literal("active"),
  	v.literal("closed"),
  	v.literal("cancelled"),
  );
  ```
- `trialCycles.list` → `requireMembership`, `.withIndex("by_startup"...).order("desc").take(MAX_LISTED_TRIALS)`, returns `{ ...trial, roleTitle: role?.title ?? "Role" }` [VERIFIED: convex/hiring/trialCycles.ts:25-44]. `MAX_LISTED_TRIALS = 40` [VERIFIED: convex/lib/limits.ts:2].
- `roles.list` → `requireMembership`, `.take(50)` (a literal, not a limits constant) [VERIFIED: convex/hiring/roles.ts:17-29].
- Founder check on the client: `useStartupRoute().member?.role === "founder"` (`MemberView` = `getBySlug` result with `role: "founder" | "member"`) [VERIFIED: src/shell/startup/StartupRoute.tsx:105-108, convex/teams/startups.ts getBySlug].

```ts
// src/features/hiring/trialCycles/constants.ts (addition)
export const TRIAL_STATUS_GROUPS = [
	{ key: "unpublished", label: "Unpublished", statuses: ["draft"] },
	{ key: "open", label: "Open", statuses: ["open"] },
	{ key: "running", label: "Running", statuses: ["active"] },
	{ key: "ended", label: "Closed / Cancelled", statuses: ["closed", "cancelled"] },
] as const;
```
Hide empty groups. Each row shows title, `roleTitle`, `formatDateRange(startsAt, endsAt)`, a status badge (draft → "Unpublished", active → "Running") and `participantCount/maxContributors`. Optionally move `roles.list`'s literal `50` into `lib/limits.ts` (e.g. `MAX_LISTED_ROLES`) while touching `roles.ts`.

### Pattern 2: Draft-only `trialCycles.update` (D-07)
**What:** a full replace of the editable fields. The form always sends the whole draft, so optional fields left out are cleared.
**Fact:** "Fields set to `undefined` are removed." [CITED: docs.convex.dev/database/writing-data]. The existing `reschedule` already relies on this to clear `applicationDeadline` [VERIFIED: convex/hiring/trialCycles.ts:206-210].

```ts
// convex/hiring/trialCycles.ts — place after `create`, before `publish` (queries → mutations → internal)
export const update = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		...draftFields, // same validator object create uses, minus startupId
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		await requireFounderMembership(ctx, trial.startupId, userId);
		if (trial.status !== "draft") {
			throw new Error("Only an unpublished hackathon can be edited");
		}

		const role = await requireOpenRoleOf(ctx, trial.startupId, args.roleId);
		requireValidSchedule(args, Date.now());
		await ctx.db.patch(trial._id, buildTrialFields(args, role));
		await replaceChallenges(ctx, trial, args.challenges, userId);
	},
});
```
`draftFields` is a shared plain object of validators (e.g. `const draftFields = { roleId: v.id("roles"), title: v.string(), ... , challenges: v.array(v.object({ title: v.string(), description: v.optional(v.string()) })) }`) declared in `trialCycles.ts`, or exported as validators from `hiring.schema.ts`. Both `create` and `update` spread it. The new error copy "Only an unpublished hackathon can be edited" is a recommendation. [ASSUMED]

### Pattern 3: Atomic Starting Pulses (D-12, discretion → choose atomic)
**Why atomic is safe:** nothing references a `challenges` row by id before the start. `copyChallengeToBoard` copies `title`/`description` into `pulses` and stores no `challengeId` [VERIFIED: convex/hiring/challenges.rules.ts:16-31], and the `challenges` table has only `by_trial` [VERIFIED: convex/hiring/hiring.schema.ts:91-97]. On a draft, delete-all + insert-all is therefore safe.
```ts
// convex/hiring/challenges.rules.ts
export async function replaceChallenges(ctx, trial, items, userId) {
	if (items.length > MAX_TRIAL_CHALLENGES) {
		throw new Error(`A Trial Cycle can have at most ${MAX_TRIAL_CHALLENGES} Challenges`);
	}
	for (const existing of await listChallenges(ctx, trial._id)) {
		await ctx.db.delete(existing._id);
	}
	for (const item of items) {
		await ctx.db.insert("challenges", { trialCycleId: trial._id, startupId: trial.startupId, ...buildChallengeFields(item), createdByUserId: userId });
	}
}
```
`MAX_TRIAL_CHALLENGES = 20` [VERIFIED: convex/lib/limits.ts:4]. The message text matches the existing `challenges.add` error [VERIFIED: convex/hiring/challenges.ts:59-62]. User-facing copy can say "Starting Pulses". Decide whether the backend message also changes to "Starting Pulses" (D-12 says the table stays `challenges` and only user-facing copy changes, so changing the thrown message is reasonable, but existing tests match on "at most"). Keep `challenges.add/remove` for open hackathons (Phase 7).

### Pattern 4: Role close guard (D-23)
```ts
// convex/hiring/roles.rules.ts (new)
export async function requireNoLiveHackathons(ctx: MutationCtx, roleId: Id<"roles">) {
	const trials = await ctx.db
		.query("trialCycles")
		.withIndex("by_role", (q) => q.eq("roleId", roleId))
		.take(MAX_ROLE_TRIALS);
	if (trials.some((trial) => trial.status === "draft" || isTrialLive(trial))) {
		throw new Error("Cancel this Role's hackathons first.");
	}
}
```
`by_role` index on trialCycles [VERIFIED: convex/hiring/hiring.schema.ts:83]. `MAX_ROLE_TRIALS = 100` [VERIFIED: convex/lib/limits.ts:12]. `isTrialLive` = `status === "open" || status === "active"` [VERIFIED: convex/hiring/trialCycles.rules.ts:41-43]. Call it in `roles.close` after `requireFounderMembership`. The automatic fill path in `offers.rules.ts` (`fillRole`-style logic, lines 30–67) closes the Role directly and cancels `open`/`draft` trials. It does **not** go through `roles.close`, so it is unaffected. [VERIFIED: convex/hiring/offers.rules.ts:46-66]

### Pattern 5: Shared schedule rule
Current checks are only `endsAt <= startsAt` → "Trial Cycle end must be after start" (in both create and reschedule) [VERIFIED: convex/hiring/trialCycles.ts:131-133, 202-204]. Publish later rejects past dates with [VERIFIED: convex/hiring/publish.rules.ts:7-8]:
```
const NEW_DATES_MESSAGE =
	"This hackathon's start or application deadline has passed. Pick new dates, then publish.";
```
Recommend `requireValidSchedule({ startsAt, endsAt, applicationDeadline }, now)` in `trialCycles.rules.ts`, used by create, update **and** reschedule:
1. `endsAt > startsAt` (keep the existing message so the existing tests still pass)
2. `startsAt > now` → "Pick a start time in the future" [ASSUMED copy]
3. if `applicationDeadline` is set: `now < applicationDeadline <= startsAt` → "The application deadline must be before the start" [ASSUMED copy]

Rule 2 is safe for the existing tests, which create in the future and then advance time [VERIFIED: trialCycles.test.ts:488-509]. A deadline after the start is pointless: entry closes at `applicationDeadline ?? startsAt` and status becomes `active` at the start anyway [VERIFIED: trialCycles.rules.ts:45-54].

### Pattern 6: Form hook (house style)
Follow `useCreateStartupWizard` / `useCycleForm`: `useState` per field (or one object), `validate(schema, input)` → `toast.error(result.message)` on failure, `isPending` guard, `toast.error(toErrorMessage(error, "..."))` on mutation failure, `useNavigate()` on success. [VERIFIED: src/features/teams/startup/public/hooks/useCreateStartupWizard.ts:153-188, src/lib/validation.ts]
For edit mode, `useHackathonDraft(trialCycleId)` composes `useQuery(api.hiring.trialCycles.get, ...)` (includes `status`, `roleIsOpen`, `isFounder`, and the new detail fields via `...trial`) [VERIFIED: trialCycles.ts:58-104] and `useQuery(api.hiring.challenges.list, ...)` (founder-only) [VERIFIED: challenges.ts:107-113]. Initialize form state **once** when both are loaded (see Pitfall 4). No new query is needed.

### Anti-Patterns to Avoid
- **`useQuery`/`useMutation` inside components** (like `WorkspaceRoles.tsx`, `TrialChallenges.tsx`): CLAUDE.md requires feature hooks.
- **`window.confirm` / `window.prompt`** for cancel or new Role: use AlertDialog / inline form (D-14's spirit, and the shadcn skill).
- **`fromDateInput` (date-only, UTC midnight)** for hackathon dates: see Pitfall 1.
- **Reading credits in Phase 1**: keeps Phase 2's HIRE-04 change clean.
- **A pre-check query for publishability**: D-13 forbids it (Phase 2, but don't build toward it).
- **Hand-rolled `div` empty states and `space-y-*` layouts**: shadcn skill rules (`Empty`, `FieldGroup`, `gap-*`). The existing code uses `space-y-*` in places. New code follows the skill.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirm dialog | `window.confirm` or a custom modal | shadcn `alert-dialog` | Focus trap, mobile, accessible title |
| Collapsible "More details" | Manual `useState` + conditional div | shadcn `collapsible` | a11y attributes and animation |
| Select for Role / type | Raw `<select>` styled by hand (PulseBoard does this) | shadcn `select` (or `toggle-group` for the 6 Role types) | Consistent look; skill rule |
| Form validation | Ad-hoc `if` chains | zod schema in `schemas/hackathon.ts` + `validate()` | Existing pattern; first-error message |
| Error text | Parsing Convex error strings | `toErrorMessage(error, fallback)` | Already strips the Convex `[...]` prefix [VERIFIED: src/lib/validation.ts:28-34] |
| Text trimming/bounds on the backend | Inline `trim()`/length checks | `requireText`, `optionalText`, `limitText` (`lib/text.ts`) | Project rule |
| Atomic multi-row write | Several client mutations | One Convex mutation (transactional) | Convex mutations are transactions; no partial drafts |

**Key insight:** the backend is the product-rule engine (PROJECT.md: "the UI must surface them, not re-implement them"). The client zod schema only mirrors basic shape and required fields for instant feedback. Date ordering and draft-only rules are enforced on the server and shown word for word.

## Runtime State Inventory

This phase removes a schema field and an endpoint (`admission`, `joinTrial`), so it is checked like a refactor.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. Memory/CONTEXT confirm there is no prod/dev data ("No production data yet"). If a dev deployment does hold `trialCycles` docs with `admission`, `convex dev` schema validation will reject the push. | Clear the dev deployment's `trialCycles` table (dashboard) if the push fails. No migration. |
| Live service config | None. Admission isn't referenced by Dodo or other external config (grep of convex/ and src/). | none |
| OS-registered state | None. Convex crons live in `convex/crons.ts` (Pro credits, Phase 2) and don't involve admission. | none |
| Secrets/env vars | None touched in Phase 1. | none |
| Build artifacts | `convex/_generated/api.d.ts` still lists `joinTrial` until `convex dev`/codegen reruns. `src/routeTree.gen.ts` (committed) must regenerate for the new routes. | Run `pnpm dev:backend` (or `pnpm exec convex codegen`) after the backend edits, and `pnpm build` (or `pnpm dev`) to regenerate `routeTree.gen.ts` before `pnpm check`. |

## Common Pitfalls

### Pitfall 1: Date-only inputs land at 05:30 IST and can already be in the past
**What goes wrong:** `fromDateInput("2026-10-05")` → `new Date("2026-10-05T00:00:00.000Z")` = 05:30 IST [VERIFIED: src/lib/dates.ts:3-5]. Picking "today" makes `startsAt <= now` for most of the day, so publish fails with NEW_DATES_MESSAGE. Start and end times can't be chosen at all.
**Why:** "date-only forms are interpreted as a UTC time and date-time forms are interpreted as a local time." [CITED: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format]
**How to avoid:** use `<Input type="datetime-local">` and add `fromDateTimeInput(value) => new Date(value).getTime()` (local) plus `toDateTimeInput(ms)` (format local `YYYY-MM-DDTHH:mm` with padded `getFullYear/getMonth+1/getDate/getHours/getMinutes`, **not** `toISOString()`, which is UTC). Display with `formatDateRange`/`toLocaleString`.
**Warning signs:** a draft created for "tomorrow" shows the previous day's date in some zones, or the prefilled edit form drifts by 5.5h.

### Pitfall 2: Removing `joinTrial` breaks about 30 test call sites
**What goes wrong:** `joinTrial` appears 30 times: `applications.test.ts` (×13), `trialCycles.test.ts` (×8), `challenges.test.ts` (×3), `pulses.board.test.ts` (×2), `trialMessages.test.ts` (×1), `explore.test.ts` (×1), `notifications.test.ts` (×1), and the `startedTrialWith` fixture (×1). `admission:` overrides appear in `credits.test.ts`, `trialMessages.test.ts`, `trialCycles.test.ts`, `applications.test.ts`, `notifications.test.ts` and `trialCycles.helpers.ts`. [VERIFIED: grep this session]
**How to avoid:** add `enterTrial(setup, trialCycleId, person)` to `trialCycles.helpers.ts` = `person.as.mutation(applyToTrial, { trialCycleId, acceptTerms: true })` then founder `decide({ applicationId, status: "joined" })` (use `applicationIdOf`). Switch `startedTrialWith` and every direct call to it. Where a test checks *entry rules* (one attempt, 5 live entries, own team, IP tick, deadline), call `applyToTrial` directly. `applied` counts as a live entry (`LIVE_ENTRY_STATUSES = ["applied", "joined"]` [VERIFIED: convex/lib/limits.ts:17]), so those tests keep their meaning. Delete "a person can join an open-admission Trial Cycle" and "a Participant joining an open Trial Cycle notifies the Founder…" (it asserts the `Someone joined …` title, which will no longer exist [VERIFIED: notifications.test.ts:38-54, applications.ts:154]). Replace them with "an accepted applicant becomes a Participant".
**Warning signs:** `tsc` errors on `api.hiring.applications.joinTrial` once codegen reruns. Run `pnpm test` after each converted file.

### Pitfall 3: Double-submit creates two drafts
**What goes wrong:** "Save for later" on `/hiring/new` is not idempotent. Two quick clicks mean two `create` calls and two drafts.
**How to avoid:** `isPending` disables the button and the hook returns early if pending. Navigate away on success. (Edit is idempotent, so it doesn't matter there.)

### Pitfall 4: Edit form re-initializes on every reactive update
**What goes wrong:** seeding `useState` from `useQuery` in an effect that runs whenever the query value changes wipes the founder's typing when any field on the doc changes (Convex is live).
**How to avoid:** initialize once, guarded by a `hasLoaded` ref, or key the form component by `trialCycleId` and pass `initialValues` only after both queries are defined. If the doc's `status` leaves `draft` while the page is open, show "This hackathon is published; its details can't be edited here" and a link back.

### Pitfall 5: The edit page reached by a member or for a non-draft
**What goes wrong:** `MemberGate` lets members through to `/hiring/new` and `/edit`. `challenges.list` throws "Only founders can perform this action" for members, which crashes the page through `useQuery`.
**How to avoid:** in the page, read `useStartupRoute().member.role`. If not founder, `<Navigate to="/s/$slug/hiring">`. Pass `"skip"` to `challenges.list` until founder status is known. For edit, if `trial === null`, `trial.startupSlug !== slug` or `trial.status !== "draft"`, show a read-only notice or redirect.

### Pitfall 6: Adding the "≥1 Starting Pulse to publish" gate in Phase 1 breaks count-sensitive tests
**What goes wrong:** `createTrial` (the fixture used by every lifecycle test) publishes without challenges. A publish gate forces the fixture to add a default challenge, which breaks the exact-board assertions in `challenges.test.ts` (`toEqual(["Build the API","Write the docs"])`, `["todo","todo"]`) and `pulses.board.test.ts` (`toHaveLength(1)`). [VERIFIED: challenges.test.ts:31-57, pulses.board.test.ts:58-59]
**How to avoid:** leave the gate to Phase 2 (publish phase). Note in Phase 2's plan that the fixtures will need a default Starting Pulse and those assertions need adjusting. Phase 1's `createDraftTrial` gets an optional `challenges` override that **defaults to `[]`**.

### Pitfall 7: Schema push fails when `admission` is removed
**What goes wrong:** if the dev deployment holds trialCycles rows with `admission`, `convex dev` rejects the new schema.
**How to avoid:** no data is expected (memory: no dev data). If the push fails, clear that table in the Convex dashboard. Don't add `v.optional` legacy fields (CLAUDE.md).

### Pitfall 8: Route ids and screen titles
**What goes wrong:** new routes render with no mobile title, or the route string in `createFileRoute` doesn't match the file path, which breaks `tsc` after regeneration.
**How to avoid:** `createFileRoute("/_shell/_authed/s/$slug/_member/hiring/new")` and `createFileRoute("/_shell/_authed/s/$slug/_member/hiring/$trialCycleId/edit")`. Add both ids to `SCREEN_TITLES` (the existing key style is `"/_shell/_authed/s/$slug/_member/hiring/": "Hiring"` [VERIFIED: src/shell/nav.ts:67]). Regenerate `routeTree.gen.ts` (it's committed). TanStack ranks the static `new` above the dynamic `$trialCycleId`, and `edit` sits under its own folder, so there's no clash. [ASSUMED: TanStack ranking; low risk because the paths differ in segment count]

### Pitfall 9: Unbounded text on trials, challenges and roles
**What goes wrong:** `create` uses `requireText` for title/description with no max. `prize` uses `optionalText` with no max. `challenges.add` has no max [VERIFIED: trialCycles.ts:135-152, challenges.ts:67-70]. `roles.create` caps skills at 12 with no tag length [VERIFIED: roles.ts:11-15]. CLAUDE.md requires `limitText`/`normalizeTags`.
**How to avoid:** add bounds to `lib/limits.ts`, e.g. `TRIAL_TEXT_LIMITS = { title: 120, description: 4000, prize: 200, detail: 2000 }`, `CHALLENGE_TEXT_LIMITS = { title: 120, description: 2000 }` [ASSUMED values]. Add a generic `requireLimitedText(value, field, max)` to `lib/text.ts` (trim + required + max) and use `limitText` for optional fields. Mirror the same maxes in the client zod schema by importing the constants from `@convex/lib/limits` (a plain-constants module with no imports [VERIFIED: limits.ts]).

## Code Examples

### Local datetime helpers
```ts
// src/lib/dates.ts (additions)
// Source: MDN Date string format — date-time without offset parses as local time.
export function fromDateTimeInput(value: string): number {
	return new Date(value).getTime(); // "YYYY-MM-DDTHH:mm" → local
}

export function toDateTimeInput(value: number): string {
	const d = new Date(value);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

### Client schema (zod 4, house style)
```ts
// src/features/hiring/trialCycles/schemas/hackathon.ts
import { MAX_TRIAL_CHALLENGES, MAX_TRIAL_PARTICIPANTS } from "@convex/lib/limits";
import { z } from "zod";

const optionalText = (max: number, label: string) =>
	z.string().trim().max(max, `${label} must be under ${max} characters`)
		.transform((value) => value || undefined).optional();

export const hackathonSchema = z.object({
	roleId: z.string().min(1, "Pick a Role"),
	title: z.string().trim().min(1, "Title is required"),
	description: z.string().trim().min(1, "Description is required"),
	maxContributors: z.number().int().min(1).max(MAX_TRIAL_PARTICIPANTS),
	startsAt: z.number(),
	endsAt: z.number(),
	applicationDeadline: z.number().optional(),
	prize: optionalText(200, "Prize"),
	expectedOutcome: optionalText(2000, "Expected outcome"),
	evaluationCriteria: optionalText(2000, "Evaluation criteria"),
	compensation: optionalText(2000, "Compensation"),
	challenges: z.array(z.object({ title: z.string().trim().min(1), description: optionalText(2000, "Description") }))
		.max(MAX_TRIAL_CHALLENGES),
}).refine((v) => v.endsAt > v.startsAt, { message: "Trial Cycle end must be after start" });
```
(`MAX_TRIAL_PARTICIPANTS = 10`, `MAX_TRIAL_CHALLENGES = 20` [VERIFIED: convex/lib/limits.ts:1,4]. The text maxes are [ASSUMED] and must match whatever the backend constants become.)

### Role types (inline "+ New Role")
`ROLE_TYPES` values [VERIFIED: src/features/hiring/roles/constants.ts:1-8]:
```
export const ROLE_TYPES = [
	{ value: "engineering", label: "Engineering" },
	{ value: "design", label: "Design" },
	{ value: "growth", label: "Growth" },
	{ value: "operations", label: "Operations" },
	{ value: "research", label: "Research" },
	{ value: "other", label: "Other" },
] as const;
```
`roles.create` args: `startupId, title, type, skills: string[], description, location?, remote?, headcount` (integer ≥ 1). It returns the new `roleId` [VERIFIED: convex/hiring/roles.ts:43-89]. The backend accepts any `type` string (the fixture uses `"full-time"` [VERIFIED: teams/startups.helpers.ts]). After create, set the picker's value to the returned id.

### Cancel dialog copy (Phase 1, no credit wording)
| status | Description text [ASSUMED copy] |
|---|---|
| draft | "This unpublished hackathon will be cancelled. Nothing was charged." |
| open | "Everyone who applied will be told it was cancelled." (Phase 2 adds the credit line via `consequence`) |
| active | "Participants will be told and work on their boards stops." |

The backend `cancel` allows `draft`, `open` and `active`, and otherwise throws "Only a draft, open or active Trial Cycle can be cancelled" [VERIFIED: convex/hiring/trialCycles.ts:242-246]. It notifies applied/joined people [VERIFIED: trialCycles.rules.ts:57-77]. It does not `logActivity` or `notifyFounders`. Optional: notify co-founders ("{title} was cancelled") per the CLAUDE.md "co-founders all get founder-facing news" rule. `activityKind` has no cancel kind [VERIFIED: convex/teams/teams.schema.ts:18-26]. Adding one would mean a schema change, so it is not recommended for Phase 1.

### Admission removal checklist (D-11)
`trialAdmission` today [VERIFIED: convex/hiring/hiring.schema.ts:6-9]:
```
export const trialAdmission = v.union(
	v.literal("open"),
	v.literal("application"),
);
```
Remove from:
1. `hiring.schema.ts`: the validator and `admission: trialAdmission` (line 65).
2. `trialCycles.ts`: the import (line 7), arg (113) and insert (147).
3. `applications.ts`: delete `joinTrial` (127-158), and the `admission !== "application"` check in `applyToTrial` (101-103).
4. `opportunities.ts`: `admission: trial.admission` (76).
5. `trialCycles.helpers.ts`: the `admission` override (14, 33).
6. Tests: listed in Pitfall 2.
7. Frontend:
   - `ApplyButtons.tsx`: drop the `admission` prop and the `joinTrial` branch.
   - `ParticipantTrialActions.tsx`: drop the `admission` prop and the join branch (nothing imports it today).
   - `PublicOpenings.tsx`: drop `admission={trial.admission}` (line ~93) and change the "Sign in to join" copy to "Sign in to apply".
8. Docs: REQUIREMENTS.md HIRE-03 ("admission mode"), PROJECT.md product rules/Key Decisions (CONTEXT canonical_refs asks for this).

[VERIFIED: grep + reads this session]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Open join or application admission | Application only (D-11) | 2026-10-04 decision | Removes `joinTrial` and the `admission` field |
| Challenges | "Starting Pulses" (copy only) | D-12 | Table name unchanged |
| `ctx.db.patch(id, …)` | Guidelines also show `ctx.db.patch("table", id, …)` | Convex 1.x guidelines | Both work. Match the existing codebase style (`patch(id, …)`) for consistency. [VERIFIED: guidelines.md:260-261, codebase] |

**Deprecated/outdated in repo:** `WorkspaceRoles.tsx`, `WorkspaceTrials.tsx` (orphaned, break the hook rule), and `askForMessage`/`confirmIpTerms` (`window.prompt`/`confirm`) in `trialCycles/constants.ts` (Phase 5 replaces them; not Phase 1).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | New error copy: "Only an unpublished hackathon can be edited", "Pick a start time in the future", "The application deadline must be before the start" | Patterns 2, 5 | Copy only; easy to change |
| A2 | Rejecting `startsAt <= now` at create/update/reschedule is desired (blocks saving an already-unpublishable draft) | Pattern 5 | If the founder wants to save half-finished drafts with past dates, it adds friction. Low risk. |
| A3 | Text length bounds (title 120, description 4000, prize 200, details 2000, challenge title 120) | Pitfall 9, Code Examples | Too tight truncates real content. Adjust constants. |
| A4 | Phase 1 ships no Publish button / "Continue to publish" and no credit reads; Phase 2 adds them | Seams table | If the user expects to publish at the end of Phase 1, the end-to-end demo waits for Phase 2. No credits exist for real founders until Phase 2 anyway. |
| A5 | The "≥1 Starting Pulse to publish" gate moves to Phase 2 | Seams, Pitfall 6 | If kept in Phase 1, expect fixture/test churn. |
| A6 | TanStack route ranking puts static `new` above dynamic `$trialCycleId` | Pitfall 8 | Paths differ in depth anyway, so effectively no risk |
| A7 | Cancel-dialog copy per status | Code Examples | Copy only |
| A8 | Recommended location `src/features/hiring/screen/` for the Hiring page | Structure | Naming only |

## Open Questions

1. **The Free plan's "1 open Role" limit is not enforced.**
   - What we know: `PLAN_LIMITS.free.openRoles = 1`, `pro.openRoles = null` [VERIFIED: convex/lib/limits.ts:41-54]. `loadStartupPlan` reports usage for display only. `roles.create` doesn't check it [VERIFIED: roles.ts:43-89, grep for `openRoles`]. D-21 says "adding beyond Free is blocked".
   - What's unclear: whether Phase 1 (Role create, HIRE-02) should enforce it.
   - Recommendation: **don't enforce in Phase 1.** It isn't a Phase 1 decision, and with D-23 a Free founder with one open Role would be stuck until their hackathons end. Raise it in Phase 2 (pricing/plan) or Phase 13. Note it in the plan's deferred items.
2. **Should closed Roles appear in the Roles tab?**
   - D-01 says "Roles list open Roles". HIRE-01 says "sees the Startup's Roles".
   - Recommendation: open Roles with Close at the top, and closed Roles in a muted read-only group below (`roles.list` already returns both).
3. **Default dates on the new form.**
   - Recommendation: start = tomorrow 10:00 local, end = start + 7 days (matches the fixture's 7-day length), no deadline. The hackathon-length question (3/5/7 days) is open in PROJECT.md. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | vite, vitest, convex CLI | ✓ | v26.3.0 | — |
| pnpm | all scripts | ✓ | 11.7.0 | — |
| Convex CLI | codegen after backend edits | ✓ (node_modules/.bin/convex) | 1.46.0 | — |
| Biome | `pnpm check` | ✓ | 2.5.14 | — |
| shadcn CLI | `pnpm ui …` | ✓ via `pnpm dlx shadcn@latest` (network OK this session) | latest | Copy component source by hand |
| Backend test suite | validation | ✓ green baseline: 19 files, 168 tests, ~12s | vitest 5.0.2 | — |

No missing dependencies. The Convex dev deployment (`pnpm dev:backend`) is needed to regenerate `convex/_generated/api.d.ts` after removing `joinTrial` and adding `update`. `convex-test` runs tests without it, but `tsc` will flag stale generated types until codegen runs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.2 + convex-test 0.0.60, `edge-runtime` environment |
| Config file | `vitest.config.ts` (include `convex/**/*.test.ts`, setup `convex/lib/timers.helpers.ts`) |
| Quick run command | `pnpm vitest run convex/hiring/<file>.test.ts` |
| Full suite command | `pnpm test` (then `pnpm check`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIRE-01 | A non-founder Member can list Roles and hackathons but can't create/update/cancel/close | unit (convex-test) | `pnpm vitest run convex/hiring/trialCycles.drafts.test.ts` | ❌ Wave 0 |
| HIRE-01 | A draft stays out of `opportunities.search`, `listOpenByStartup` and a non-member's `get` | unit | `pnpm vitest run convex/hiring/trialCycles.test.ts -t "hidden draft"` | ✅ (convert the joinTrial line to applyToTrial) |
| HIRE-02 | A Role with an unpublished/open/running hackathon can't be closed: "Cancel this Role's hackathons first." | unit | `pnpm vitest run convex/hiring/roles.test.ts` | ❌ add test |
| HIRE-02 | A Role whose hackathons are all closed/cancelled can be closed | unit | same | ❌ add test |
| HIRE-03 | Creating a draft saves Starting Pulses and More-details fields atomically | unit | `pnpm vitest run convex/hiring/trialCycles.drafts.test.ts` | ❌ Wave 0 |
| HIRE-03 | `update` edits every field and replaces Starting Pulses on a draft | unit | same | ❌ |
| HIRE-03 | `update` rejects a published hackathon, a non-founder, another startup's Role, and a closed Role | unit | same | ❌ |
| HIRE-03 | More than 20 Starting Pulses are rejected | unit | same | ❌ |
| HIRE-03 | Every entrant applies; founder admission makes a Participant (D-11) | unit | `pnpm vitest run convex/hiring/trialCycles.test.ts` | ✅ convert |
| HIRE-09 | Schedule rules: end after start, deadline ≤ start, start in the future (create/update/reschedule) | unit | `pnpm vitest run convex/hiring/trialCycles.drafts.test.ts` | ❌ |
| HIRE-09 | Reschedule a draft; only a draft reschedules | unit | `pnpm vitest run convex/hiring/trialCycles.test.ts -t "rescheduling"` | ✅ |
| HIRE-09 | Cancel a draft / an open / an active hackathon | unit | `pnpm vitest run convex/hiring/trialCycles.test.ts -t "cancelling"` | ✅ draft + active; ❌ add open |
| UI (all) | Tabs, grouping, phone width, read-only member view, form create/edit | manual (no frontend tests per REQUIREMENTS Out of Scope) | `pnpm check` + human verify at 375px width | — |

### Sampling Rate
- **Per task commit:** `pnpm vitest run <touched test file>`
- **Per wave merge:** `pnpm test && pnpm check`
- **Phase gate:** full suite green (baseline 168 tests, minus deleted open-join tests, plus new ones) and `pnpm check` clean before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `convex/hiring/trialCycles.drafts.test.ts`: create/update/schedule/permissions (use `describe` groups; it will exceed 10 tests)
- [ ] `convex/hiring/trialCycles.helpers.ts`: `enterTrial(setup, trialCycleId, person)`, a `challenges` override (default `[]`), plus `admission` removed
- [ ] `convex/hiring/roles.test.ts`: D-23 tests
- [ ] Convert every `joinTrial` call site (Pitfall 2) in the same wave as the D-11 backend removal, so the suite never sits red across waves

## Security Domain

`security_enforcement: true`, ASVS level 1 [VERIFIED: .planning/config.json].

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (inherited) | `@convex-dev/auth` + `requireUserId(ctx)` first in every handler |
| V3 Session Management | no (unchanged) | Convex Auth sessions |
| V4 Access Control | **yes** | `requireFounderMembership` on update/create/cancel/close; `requireMembership` on lists; **IDOR checks**: `update` must load the trial and guard on `trial.startupId` (never trust a client startupId), and `roleId` must belong to the same startup (`requireOpenRoleOf`). `replaceChallenges` only touches `by_trial` rows of that trial. |
| V5 Input Validation | **yes** | Convex `v.*` arg validators + `requireText`/`limitText` bounds + array length cap (`MAX_TRIAL_CHALLENGES`) + `maxContributors` clamp (existing) + schedule rule. Client zod is UX only. |
| V6 Cryptography | no | — |

### Known Threat Patterns for Convex + React SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Editing another startup's draft by id (IDOR) | Elevation / Tampering | Guard on the loaded doc's `startupId`; test "a founder of another startup can't update it" |
| Attaching a draft to another startup's Role | Tampering | `role.startupId === trial.startupId` check (create already does this [VERIFIED: trialCycles.ts:124-127]) |
| Editing a published hackathon (bypassing the charge point / changing dates after payment) | Tampering | `status === "draft"` check in `update`; test |
| Draft leakage before payment | Information disclosure | No new public reads; `get` already returns null for drafts to non-members [VERIFIED: trialCycles.ts:67-71] |
| Oversized payloads (huge text, 1000 challenges) | DoS | Text maxes + array cap enforced server-side |
| XSS through descriptions/prize | Tampering | React escapes by default; render with `whitespace-pre-wrap`, never `dangerouslySetInnerHTML` |
| Member closing Roles or cancelling via a crafted call | Elevation | Founder guards (existing) + a test for the member path |

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `convex/hiring/{hiring.schema,trialCycles,trialCycles.rules,trialCycles.helpers,roles,roles.test,publish.rules,challenges,challenges.rules,applications,applications.rules,opportunities,ipTerms.rules,offers.rules}.ts`, `convex/lib/{limits,text,auth,testing.helpers}.ts`, `convex/teams/{plan.rules,membership.rules,startups.helpers,teams.schema}.ts`, `convex/people/users.helpers.ts`, `convex/schema.ts`, `convex/auth.ts`, `convex/billing/credits.ts` (head), tests (grep + partial reads), `src/routes/.../hiring/index.tsx`, `src/shell/{startup/*,hooks/*,nav.ts}`, `src/features/hiring/**`, `src/features/teams/startup/{workspace,public}/**`, `src/features/work/{cycles,pulses}/**`, `src/lib/{dates,validation}.ts`, `package.json`, `components.json`, `vitest.config.ts`, `vite.config.ts`, `.claude/skills/shadcn/SKILL.md`, `.planning/{PROJECT,REQUIREMENTS,ROADMAP,STATE}.md`, `01-CONTEXT.md`.
- `pnpm test` baseline: 19 files, 168 passed.
- `pnpm dlx shadcn@latest view alert-dialog select field empty collapsible checkbox spinner`: dependency lists.

### Secondary (MEDIUM confidence)
- docs.convex.dev/database/writing-data: "Fields set to `undefined` are removed." (patch semantics)
- developer.mozilla.org Date#date_time_string_format: date-only = UTC, date-time = local.

### Tertiary (LOW confidence)
- TanStack Router static-over-dynamic ranking (training knowledge; low impact).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Everything is installed; component deps checked against the registry.
- Architecture: HIGH. Derived from existing endpoints, guards and the house form pattern.
- Pitfalls: HIGH for repo-derived items (test churn, date handling, guards); MEDIUM for copy/limit choices (assumptions A1–A3).

**Research date:** 2026-10-04
**Valid until:** 2026-11-03 (stable brownfield; re-check if Phase 2 lands first or the schema changes)
