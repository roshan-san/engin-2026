# Phase 1: Founder Hiring & Publish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-04 (revision of 2026-10-01 context)
**Phase:** 01-founder-hiring-publish
**Areas discussed:** review of all 18 original decisions, cancel refunds, Role close, member view, credit model

---

## Layout (orig. D-01..D-04)

| Option | Selected |
|--------|----------|
| One scrolling page | |
| Tabs | ✓ (Hackathons \| Roles, credit badge in header) |

- Credits: count only, no breakdown.
- Rows: kept.
- Empty state: "the whole free code thing shouldn't be in the app, it's for my marketing reasons" → codes removed from the app entirely.

## Draft form (orig. D-05..D-08)

- Full page, Role picker: kept.
- Fields: "no open join" → application only, removed from the backend too.
- Challenges: the user asked what they are. Answer: "keep it most similar to what internal cycles follow" → labelled "Starting Pulses", reusing the Cycle pulse-add UI.
- Edit dates → full draft edit. The user asked what a draft is and wanted the best option for UI and conversion. Claude recommended one form for create and edit, with a "Continue to publish" primary button. Accepted.

## Publish (orig. D-10..D-13)

- Pre-check before the click: "Only after click".
- Publish dialog: add a Pro nudge (the user noted Pro = 2 credits/month).
- Stealth: message only.
- Dates passed: inline in the publish popup.

## Checkout return (orig. D-14..D-17)

- Backend-state banner: kept. Soft timeout / late-payment banners: "Simpler".

## Ops (orig. D-18)

- Explained "ops". Free credits: "the free credit is upon creation of the account, the pro discount code in dodo payments i will see in gtm strategy".

## New areas

- Cancel paid hackathon: refund before start ✓ (vs warn only).
- Role close / members: block close + read-only members ✓.

## Credit model

- Pro bank cap: 4. The user asked which model is best for conversion and for keeping free users. Claude recommended: signup credit never expires; Pro 2/month rolls over up to 4; the no-credit popup offers Pay ₹2,999 or Go Pro. Locked.

## Claude's Discretion

- Banner copy and placement, atomic challenge seeding, refund mechanism, component breakdown.

## Deferred Ideas

- Inline stealth toggle (Phase 6), soft-timeout banners, return-URL status, pricing page explanation (Phase 2), Dodo discount codes (go-to-market plan), ₹1,499 top-up pricing review.
