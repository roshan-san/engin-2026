# Phase 1: Founder Hiring & Publish - Context

**Gathered:** 2026-10-01 (revised 2026-10-04)
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the `StubScreen` at `/s/$slug/hiring` with a working founder Hiring screen on the existing Convex backend. A founder can:

- see Roles and hackathons (Trial Cycles)
- create and close a Role
- create a hackathon with starting Pulses, save it unpublished, and edit it until it is published
- see their hackathon credit balance
- publish with a credit, or pay through Dodo INR checkout (or go Pro), with the webhook auto-publishing
- fix dates that passed, and cancel

Backend changes that belong to this phase, as decided below:

- application-only admission
- a draft `update` mutation
- one free credit at signup, replacing launch/UPI codes
- Pro credits at 2 a month with a bank cap of 4
- a credit refund when a hackathon is cancelled before it starts
- a Role close that is blocked while it has hackathons

Also OPS-01: the Dodo test-mode INR products and Convex env vars.

Requirements: HIRE-01..10 and OPS-01. **HIRE-05 is rewritten** (see D-20): founders don't claim codes in the app any more.

Not in this phase:
- the public hackathon page, Discover and the pricing page (Phase 2)
- the trial run screen at `/s/$slug/trials/$trialCycleId` (Phase 3)
- the Settings screen, including the stealth toggle (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Hiring screen layout
- **D-01:** Two tabs, **Hackathons | Roles**, with Hackathons as the default. The credit count is a small badge in the page header, visible on both tabs. Hackathons are grouped by status: Unpublished (draft) → Open → Running → Closed/Cancelled. Roles list open Roles, each with Close. It must work at phone width.
- **D-02:** Credits show as a **count only** ("2 hackathon credits"), with no per-credit source/expiry breakdown and **no code input anywhere in the app**. The data comes from `api.billing.credits.balance`.
- **D-03:** Hackathon rows act according to their status:
  - every row shows title, Role, dates, status badge and participant count
  - Unpublished: Publish / Edit / Cancel
  - Open or Running: a link to `/s/$slug/trials/$trialCycleId` (Phase 3; it may land on its stub for now) and Cancel where the backend allows it
  - Closed or Cancelled: read-only
- **D-04:** The empty state is a guided first step, "Run your first hiring hackathon". One button opens the new-hackathon page with "+ New Role" ready. When the founder has their free signup credit, the copy says the first hackathon is free ("Your first hackathon is on us"). Never mention codes.
- **D-05:** Non-founder members see both tabs **read-only**: no credit badge and no actions. The backend `list` queries already allow members, and every mutation stays founder-guarded.

### Creating and editing a hackathon
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

### Publish & blocked states
- **D-13:** Errors appear **only after the click**, with no pre-check query. The publish dialog calls the mutation and shows the backend's thrown message verbatim, adding a fix action only where one exists (D-15).
- **D-14:** One publish dialog adapts to the founder's balance:
  - The required IP acknowledgment tick (founder side of the IP terms) is at the top. This replaces any `window.confirm`-style prompt.
  - With a credit, the button reads "Publish (uses 1 credit, N left)". When the only credit is the signup one, it reads "Publish, uses your free credit". It calls `trialCycles.publish({ acceptTerms: true })`, and the UI guards against double-submit.
  - With no credit, the main button reads "Pay ₹2,999" (Free plan) or "Pay ₹1,499" (Pro top-up) and calls `billing.checkout.createHackathonCheckout`, then redirects. A Free founder also sees a **Go Pro option**: "or go Pro, ₹999/month, 2 hackathons every month", which starts the Pro checkout through the existing upgrade path (`useUpgrade`). No code field.
- **D-15:** Fixes after a failed click:
  - **Stealth:** show the backend message only, with no inline "Turn off stealth" button. Accepted gap: until Phase 6 Settings ships, there's no in-app stealth toggle.
  - **Dates passed** (`NEW_DATES_MESSAGE`): date fields (start/end/deadline) appear **inside the publish dialog** and save through `reschedule` (or the D-07 `update`). Then Publish is enabled. One shared date-fields component serves the form and the dialog.
  - Role closed: message only. This can't happen once D-22 is in place, but the message stays.

### Return from checkout
- **D-16:** Dodo's `returnUrl` is the plain Hiring screen, `${origin}/s/$slug/hiring`, with no query param. The UI never treats the redirect as proof of payment. State always comes from Convex.
- **D-17:** "Checkout in progress" is detected from backend state. `prepareHackathonCheckout` sets `ipAcknowledgedAt` on the draft before taking money. An unpublished hackathon with `ipAcknowledgedAt` set shows a live "Confirming payment… this publishes automatically" banner, which flips to "Live!" when the status becomes `open`. It works even if the tab was closed (HIRE-08).
- **D-18:** **Simple version**, with no soft timeout and no "No payment yet" state. If the payment lands after the dates passed (HIRE-10), the credit shows in the balance and the hackathon stays unpublished. The founder clicks Publish, gets the dates message, and fixes it in the dialog (D-15). The banner may simply drop once the credit is in the balance and the trial is still a draft (planner's call on the exact condition).

### Credits & pricing model (backend changes)
- **D-19:** **Signup credit:** every new account gets 1 free hackathon credit when it is created, with **no expiry**. Add a new credit source (e.g. `signup`) with grant key `signup:{userId}` so it's idempotent. Hook the grant into user creation: `convex/auth.ts` has no callback today, so add `callbacks.afterUserCreatedOrUpdated` (or equivalent) that grants only on creation. The multi-Google-account abuse risk is accepted for now. — **Reversibility:** one-way — once founders have received free credits, taking the offer back is a public pricing change.
- **D-20:** **Remove launch/UPI codes completely:** `claimLaunchCode`, `createLaunchCode`, their table/schema, the `launch`/`upi` credit sources, tests and the CLAUDE.md operator line. HIRE-05 becomes "every new founder account starts with 1 free credit, shown in the balance". Pro discount codes live in Dodo (the user's go-to-market plan, not app work). `grantRerunCredit` stays as the only operator grant.
- **D-21:** **Pro = 2 credits a month, rolling over up to 4 banked**, lapsing at period end if Pro is cancelled. The existing mechanism stays, and only the numbers change: `grantMonthlyProCredits` grants 2 per month (grant keys need a per-credit suffix, e.g. `pro_monthly:{userId}:{YYYY-MM}:{n}`), and `MAX_BANKED_PRO_CREDITS` goes from 3 to 4 (the grant must not overshoot the cap). The rule to show users: "Credits don't expire. Pro credits roll over up to 4 and lapse if you cancel Pro." The **pricing/marketing page (Phase 2, PUBL-07) must explain this.**
- **D-22:** **Cancel refunds the credit before the start.** Cancelling an **open** hackathon (published, not yet started) returns the credit that paid for it. Cancelling a **running** one does not. Cancelling an unpublished one costs nothing. The cancel confirm states which case applies ("Your credit will be returned" or "Cancelling won't return your credit"). The planner chooses how to refund: re-grant the same source with its original expiry, or un-spend the credit row, keyed so it can't refund twice.
- **D-23:** **Closing a Role is blocked** while it has an unpublished, open or running hackathon: "Cancel this Role's hackathons first." Change `roles.close` and add a test.

### OPS-01
- **D-24:** Creating the Dodo products (Pro monthly ₹999, Pro yearly ₹9,999, Hackathon ₹2,999, Hackathon for Pro ₹1,499) and setting `DODO_MONTHLY_PLAN_ID`, `DODO_YEARLY_PLAN_ID`, `DODO_HACKATHON_PRODUCT_ID` and `DODO_HACKATHON_PRO_PRODUCT_ID` is a manual task for the user. The plan includes a `checkpoint:human-action` with exact click-by-click steps, test mode first, and doesn't try to automate it. The user isn't fluent in ops terms, so write the steps plainly.

### Claude's Discretion
- Copy, the exact banner placement (row vs top of screen) and the drop condition for the banner (D-18).
- Whether challenge seeding is atomic (D-12), and the refund mechanism (D-22).
- Component breakdown and the form/validation approach, following existing `src/features/hiring/*` patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & pricing rules
- `.planning/PROJECT.md` → Context → Product rules: charge point, publish check order, credits, webhook fulfilment, stealth, IP. **Note:** D-11, D-19..D-22 change some of these rules, so update PROJECT.md (Product rules + Key Decisions) and REQUIREMENTS.md (HIRE-05 text) when executing.
- `convex/hiring/publish.rules.ts`, `convex/billing/credits.rules.ts`, `convex/billing/credits.ts`, `convex/billing/webhooks.ts` and their tests are the source of truth for current behaviour.

### Project
- `.planning/REQUIREMENTS.md` (HIRE-01..10, OPS-01), `.planning/ROADMAP.md` Phase 1 success criteria. Criterion 3 (launch code claim) is superseded by D-19/D-20.
- `CLAUDE.md`: repo architecture, guard pattern, bounded reads, route/feature layout, hooks own `useQuery`/`useMutation`, schema per domain.
- `convex/_generated/ai/guidelines.md`: Convex API conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `convex/hiring/roles.ts`: `list`, `listOpenByStartup`, `create`, `close` (gets the D-23 guard).
- `convex/hiring/trialCycles.ts`: `list` (requireMembership, includes `roleTitle`), `create`, `publish({ trialCycleId, acceptTerms })`, `reschedule` (draft only), `cancel` (draft or live; burns the credit today, see D-22). Add `update` (D-07).
- `convex/hiring/challenges.ts` / `challenges.rules.ts`: `list`, `add`, `remove`; `seedBoards` turns challenges into per-participant Pulses at start.
- `convex/billing/credits.ts`: `balance`, `claimLaunchCode`/`createLaunchCode` (to remove, D-20), `grantRerunCredit`, `grantMonthlyProCredits` (D-21). `convex/lib/limits.ts` `MAX_BANKED_PRO_CREDITS`.
- `convex/billing/checkout.ts`: `createHackathonCheckout({ trialCycleId, returnUrl, acceptTerms })` → `{ checkoutUrl }`. It stamps `ipAcknowledgedAt` first.
- `convex/billing/webhooks.ts`: grants a `purchase` credit, then auto-publishes if `publishProblem` is null.
- `convex/auth.ts`: plain `convexAuth({ providers: [Google] })` with no callbacks yet (D-19 hook point).
- `src/features/marketing/pricing/hooks/useUpgrade.ts`: Pro checkout redirect (D-14 Go Pro), plus `api.billing.plan.getPlan` for the ₹2,999 vs ₹1,499 label.
- `src/features/work/{cycles,pulses}/components`: the pulse-add UI to mirror for Starting Pulses (D-12).
- `src/features/hiring/roles/constants.ts` (`ROLE_TYPES`), `src/features/hiring/trialCycles/constants.ts`.
- `src/shell/hooks/useStartupBySlug.ts`, `useFocusedStartup`, `useCurrentUser` for the startup and founder role (D-05 read-only).
- `src/components/ui/*` shadcn (Tabs, Dialog, Badge), `sonner` toasts.

### Established Patterns
- Thin route files under `src/routes/_shell/_authed/s/$slug/_member/hiring/` render pages from `src/features/hiring/<area>/pages`.
- Convex calls live only in feature hooks and pass `"skip"` until args are ready.
- Backend errors are plain `Error`s with user-facing messages, shown verbatim.
- New backend code follows `requireUserId` → guard, bounded reads, and a test next to the module.

### Integration Points
- `src/routes/_shell/_authed/s/$slug/_member/hiring/index.tsx`: replace the `StubScreen`.
- New routes: `hiring/new.tsx` and `hiring/$trialCycleId/edit.tsx`. `routeTree.gen.ts` regenerates.
- Open/running rows link to `src/routes/_shell/_authed/s/$slug/trials/$trialCycleId.tsx`.
- Admission removal touches `ApplyButtons.tsx`, `ParticipantTrialActions.tsx` and `PublicOpenings.tsx`.

</code_context>

<specifics>
## Specific Ideas

- No codes in the app. Codes are the user's marketing tool, outside the product. Free credits come from signup.
- Say "first hackathon is free" in the app (empty state, publish button).
- Conversion shapes the flow: save before pay, put Publish/Pay one click from the form, and offer Go Pro beside "Pay ₹2,999".
- Copy names prices in INR and keeps contributors free. Never suggest paid visibility.
- Payment state comes from Convex, never from the redirect.
- The user isn't technical about ops or internals. Human-action steps and UI copy should be plain language.

</specifics>

<deferred>
## Deferred Ideas

- Inline "Turn off stealth" in the publish dialog: not chosen. Stealth is handled by Phase 6 Settings (TEAM-03).
- Soft-timeout / "No payment yet" checkout banners: not chosen (simple version). Revisit if founders get confused.
- Reading Dodo's return-URL status for an instant "Payment cancelled": not chosen.
- The pricing page must explain the credit model (2/month Pro, roll-over to 4, free first hackathon): Phase 2, PUBL-07.
- Pro discount codes: in the Dodo dashboard, part of the go-to-market plan, not app work.
- Note for pricing: at 2/month for ₹999, Pro is about ₹500 per hackathon, so the ₹1,499 top-up rarely beats it. Revisit prices with real founders.

</deferred>

---

*Phase: 01-founder-hiring-publish*
*Context gathered: 2026-10-01, revised 2026-10-04*
