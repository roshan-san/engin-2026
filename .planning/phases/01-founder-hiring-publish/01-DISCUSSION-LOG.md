# Phase 1: Founder Hiring & Publish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log keeps the alternatives that were considered.

**Date:** 2026-10-01
**Phase:** 01-founder-hiring-publish
**Areas discussed:** Hiring screen layout, Creating a draft, Publish & blocked states, Return from checkout

---

## Hiring screen layout

| Question | Options | Selected |
|----------|---------|----------|
| Organization | One page, sections / Tabs: Trial Cycles / Roles | One page, sections |
| Credit balance | Card with breakdown / Compact chip | Card with breakdown |
| Trial row | Status-aware actions / Row opens a detail page | Status-aware actions |
| Empty state | Guided first step / Plain empty state | Guided first step |

## Creating a draft

| Question | Options | Selected |
|----------|---------|----------|
| Where | Full page / Sheet-dialog | Full page |
| Role | Pick or create inline / Separate step | Pick or create inline |
| Fields | Essentials + 'More' / Everything visible | Essentials + 'More' |
| Challenges | In the form, saved with the draft / After saving | In the form |

## Publish & blocked states

| Question | Options | Selected |
|----------|---------|----------|
| Blockers | Before clicking (new pre-check query) / Only on click | Before clicking |
| Pay path | One dialog, adapts / Separate steps | One dialog, adapts |
| Stealth | Inline 'Go public' / Link to Settings | Inline 'Go public' |
| Past dates | Inline date picker / Go to edit page | Inline date picker |

## Return from checkout

| Question | Options | Selected |
|----------|---------|----------|
| Return URL | Hiring screen + draft id / Plain Hiring screen | **Plain Hiring screen** (not the recommended option) |
| Waiting | Live banner, then soft timeout / Nothing special | Live banner, then soft timeout |
| Late pay | Banner + date prompt / Generic blocked state | Banner + date prompt |
| Abandoned | Same banner, times out / Read Dodo's status param | Same banner, times out |

**Notes:** The plain return URL plus the live banner were reconciled by keying "checkout in progress" off the draft's `ipAcknowledgedAt`, which `prepareHackathonCheckout` sets before payment. No URL param is needed, and this also covers a closed tab.

## Claude's Discretion

- Banner timing windows and copy; challenge seeding atomicity; component breakdown.

## Deferred Ideas

- Full Settings stealth toggle → Phase 6.
- Reading Dodo's return status param → not chosen.
