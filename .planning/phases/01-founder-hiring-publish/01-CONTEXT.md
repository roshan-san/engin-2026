# Phase 1: Founder Hiring & Publish - Context

**Gathered:** 2026-10-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the `StubScreen` at `/s/$slug/hiring` with a working founder Hiring screen on the existing Convex backend. A founder can:

- see Roles and Trial Cycles
- create and close a Role
- create a draft Trial Cycle with seeded challenges
- see their hackathon credit balance and claim a launch/UPI code
- publish a draft with a credit, or pay through Dodo INR checkout, with the webhook auto-publishing
- reschedule and cancel

Also OPS-01: the Dodo test-mode INR products and Convex env vars.

Requirements: HIRE-01..10 and OPS-01.

Not in this phase:
- the public hackathon page and Discover (Phase 2)
- the trial run screen at `/s/$slug/trials/$trialCycleId` (Phase 3)
- the Settings screen (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Hiring screen layout
- **D-01:** One scrolling page with no tabs. Order: credit balance card, then Trial Cycles grouped by status (Draft → Open → Running → Closed/Cancelled), then Roles with a Close action per open Role. It must work at phone width.
- **D-02:** The credit balance is a card that shows the count ("2 hackathon credits") and each credit's source (launch code / Pro / purchase / re-run) with its expiry, from `api.billing.credits.balance`. The card includes an inline "Have a code?" input that calls `claimLaunchCode`. The backend normalizes case, spaces and dashes. Errors such as "already used" show inline or as a toast.
- **D-03:** Trial Cycle rows act according to their status:
  - every row shows title, Role, dates, status badge and participant count
  - Draft: Publish / Edit dates / Cancel
  - Open or Running: a link to `/s/$slug/trials/$trialCycleId` (that screen is Phase 3; the link may land on its stub for now) and Cancel where the backend allows it
  - Closed or Cancelled: read-only
- **D-04:** The empty state (no Roles or Trial Cycles) is a guided first step, "Run your first hiring hackathon". One button opens the draft page with "+ New Role" ready, plus one line on cost: ₹2,999, or free with a code.

### Creating a draft
- **D-05:** Drafts are created on a full page, `/s/$slug/hiring/new`, with a thin route file and the page in `src/features/hiring/...`. Not a dialog, because a dialog gets cramped on mobile with a challenge list.
- **D-06:** A Role picker sits at the top of the draft form and lists open Roles, with "+ New Role" inline: title, type (`ROLE_TYPES`), skills, short description, headcount defaulting to 1. Creating a Role selects it. Closing a Role happens from the Roles section on the Hiring screen.
- **D-07:** Fields:
  - Essentials, always visible: title, description, admission (open join / application), max participants (backend clamps to `MAX_TRIAL_PARTICIPANTS`, 10), start and end, optional entry deadline, optional prize (free text), challenges.
  - Collapsed under "More details": expected outcome, evaluation criteria, compensation.
- **D-08:** Challenges are entered in the same form as a list of title + description and are saved with the draft. The backend `trialCycles.create` takes no challenges today. The planner chooses between creating the draft and then calling `challenges.add` for each one, or extending `create` to take challenges atomically (preferred if simple, so a failure doesn't leave a half-seeded draft). Challenges stay editable while the Trial Cycle is a draft or open.
- **D-09:** "Edit dates" on a draft reuses one shared date-fields component (start/end/deadline) that calls `trialCycles.reschedule`. The publish dialog uses the same component (D-13).

### Publish & blocked states
- **D-10:** Blockers show before the founder clicks. Add a small founder-guarded query that returns `publishProblem(trial, now)` from `convex/hiring/publish.rules.ts` for a draft, or null. The publish dialog shows the reason and its fix up front. The `publish` mutation still re-checks on click, and its thrown message is shown as-is if it differs. Messages are the backend's exact strings, for example `NEW_DATES_MESSAGE`.
- **D-11:** One publish dialog adapts to the founder's balance:
  - The required IP acknowledgment tick (founder side of the design's IP terms) is at the top.
  - With a credit, the button reads "Publish (uses 1 credit, N left)" and calls `trialCycles.publish({ acceptTerms: true })`. Double-submit is guarded in the UI too, though the backend is already one-mutation idempotent.
  - With no credit, the button reads "Pay ₹2,999", or "₹1,499" when the founder's plan is Pro, and calls `billing.checkout.createHackathonCheckout`, then redirects. An inline "Have a code?" field sits next to it. A successful claim flips the button to Publish.
- **D-12:** If the startup is in stealth, the dialog explains that every hackathon names the real startup and offers a "Turn off stealth" button. It calls the existing `teams.startups.update` with `isPublic: true` and then allows publishing. No link to Settings.
- **D-13:** If the dates have passed, the dialog shows "Pick new dates" with the shared date fields inline. It calls `reschedule`, then Publish is enabled.

### Return from checkout
- **D-14:** Dodo's `returnUrl` is the plain Hiring screen, `${origin}/s/$slug/hiring`, with no query param. The UI never treats the redirect as proof of payment. State always comes from Convex.
- **D-15:** "Checkout in progress" is detected from backend state, not the URL. `prepareHackathonCheckout` already sets `ipAcknowledgedAt` on the draft before taking money. A draft that has `ipAcknowledgedAt` set but is still `draft` shows a live banner on its row or the screen: "Confirming payment… this publishes automatically". The banner flips to "Live!" when the status becomes `open`. Because it reads backend state, it also works if the tab was closed and reopened (HIRE-08).
- **D-16:** Soft timeout. After about 60s since `ipAcknowledgedAt` (exact window is Claude's discretion), the banner reads "Still confirming. You can close this tab, it'll publish on its own." After a longer window with no new credit, it becomes "No payment yet", with a Try again button that reopens the publish dialog. The banner can be dismissed. An abandoned or cancelled checkout gets no special handling.
- **D-17:** Late payment (HIRE-10): the webhook granted a `purchase` credit but `publishProblem` blocked the auto-publish because the dates passed. The banner reads "Payment received, your credit is saved. Pick new dates to publish" and opens the inline date picker (D-13). Publishing then spends that credit through the normal `publish` path. The planner decides how to detect this, for example `ipAcknowledgedAt` set + still draft + a `NEW_DATES_MESSAGE` problem + balance ≥ 1, or whether the credit ledger links to the trial.

### OPS-01
- **D-18:** Creating the Dodo products (Pro monthly ₹999, Pro yearly ₹9,999, Hackathon ₹2,999, Hackathon for Pro ₹1,499) and setting `DODO_MONTHLY_PLAN_ID`, `DODO_YEARLY_PLAN_ID`, `DODO_HACKATHON_PRODUCT_ID` and `DODO_HACKATHON_PRO_PRODUCT_ID` is a manual task for the user. The plan should include a `checkpoint:human-action` with exact steps, test mode first, and not try to automate it.

### Claude's Discretion
- Exact banner timing windows (D-16), the copy, and whether the banners sit on the row or at the top of the screen.
- Whether the challenge seeding is atomic (D-08).
- Component breakdown, form library or validation approach, following the existing patterns in `src/features/hiring/*`.
- Replacing `window.confirm`-style IP prompts with a proper checkbox in the founder publish dialog. The contributor side is Phase 2.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & pricing rules
- `.planning/PROJECT.md` → Context → Product rules: charge point, publish check order, credit ownership and sources, webhook fulfilment, stealth, IP.
- `convex/hiring/publish.rules.ts`, `convex/billing/credits.rules.ts`, `convex/billing/webhooks.ts` and their tests are the source of truth for behaviour.

### Project
- `.planning/REQUIREMENTS.md` (HIRE-01..10, OPS-01), `.planning/ROADMAP.md` Phase 1 success criteria.
- `CLAUDE.md`, the repo architecture: guard pattern, bounded reads, route/feature layout, hooks own `useQuery`/`useMutation`.
- `convex/_generated/ai/guidelines.md`: Convex API conventions for any new query.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `convex/hiring/roles.ts`: `list`, `listOpenByStartup`, `create`, `close`.
- `convex/hiring/trialCycles.ts`: `list` (by startup, includes `roleTitle`), `create` (inserts a draft), `publish({ trialCycleId, acceptTerms })`, `reschedule`, `cancel`.
- `convex/hiring/challenges.ts`: `list`, `add`, `remove` (allowed while draft/open).
- `convex/billing/credits.ts`: `balance` (`{ available, credits[{source, expiresAt}] }`), `claimLaunchCode({ code })`.
- `convex/billing/checkout.ts`: `createHackathonCheckout({ trialCycleId, returnUrl, acceptTerms })` returns `{ checkoutUrl }`. It runs `requirePublishable` and stamps `ipAcknowledgedAt` first.
- `convex/hiring/publish.rules.ts`: `publishProblem`, `NEW_DATES_MESSAGE`. The new pre-check query (D-10) reuses `publishProblem`.
- `convex/billing/webhooks.ts`: grants a `purchase` credit, then auto-publishes if `publishProblem` is null.
- `convex/teams/startups.ts` `update` accepts `isPublic` (D-12).
- `src/features/marketing/pricing/hooks/useUpgrade.ts`: pattern for an action → `window.location.href = checkoutUrl`, plus `api.billing.plan.getPlan` for the plan tier (₹2,999 vs ₹1,499 label).
- `src/features/hiring/roles/constants.ts` (`ROLE_TYPES`), `src/features/hiring/trialCycles/constants.ts` (`CONTRIBUTOR_IP_TERMS`).
- `src/shell/hooks/useStartupBySlug.ts`, `useFocusedStartup`, `useCurrentUser` for the startup id and founder role.
- `src/components/ui/*` shadcn components; `sonner` toasts.

### Established Patterns
- Thin route files under `src/routes/_shell/_authed/s/$slug/_member/hiring/` that render pages from `src/features/hiring/<area>/pages`.
- Convex calls live only in feature hooks and pass `"skip"` until args are ready.
- Backend errors are plain `Error`s with user-facing messages, shown verbatim.
- Any new backend query follows `requireUserId` → `requireFounderMembership`, bounded reads, and a test next to the module.

### Integration Points
- `src/routes/_shell/_authed/s/$slug/_member/hiring/index.tsx`: replace the `StubScreen`.
- New route `src/routes/_shell/_authed/s/$slug/_member/hiring/new.tsx` (D-05). `routeTree.gen.ts` regenerates.
- Open/running rows link to the existing `src/routes/_shell/_authed/s/$slug/trials/$trialCycleId.tsx`.

</code_context>

<specifics>
## Specific Ideas

- Copy names the price in INR and keeps contributors free. Never suggest paid visibility.
- Blocked-state messages are the backend strings word for word. The UI adds only the fix action next to them.
- Payment state must survive closing the tab. It is read from Convex, never from the redirect.

</specifics>

<deferred>
## Deferred Ideas

- Full Settings screen with the stealth toggle: Phase 6 (TEAM-03). The inline "Turn off stealth" covers Phase 1.
- Reading Dodo's return-URL payment status to show "Payment cancelled" instantly: considered but not chosen. Revisit only if founders get confused.

</deferred>

---

*Phase: 01-founder-hiring-publish*
*Context gathered: 2026-10-01*
