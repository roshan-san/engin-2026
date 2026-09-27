# Startups pay; talent and visibility are never for sale

The Plan belongs to the Startup, and Pro is a flat subscription per Startup ($10/month, shown in the buyer's local currency). Everything a person does as talent is free and unlimited: finding and joining Trial Cycles, building Score, their profile. Nobody can pay for contact or visibility: there's no paid messaging or outreach, and no promoted Startups, Roles or Trial Cycles. Opportunities and Explore rank on merit only.

Engin is a two-sided marketplace. Every limit placed on talent shrinks the pool that Founders are paying to reach, and paying to be seen would destroy the trust that talent places in the listings. We deliberately don't want to be LinkedIn. Contact can't be fenced in anyway, because a Contributor's profile links elsewhere.

## Considered Options

- **Limiting talent's active Trial Cycle entries** (the original gate: 3 on Free). Removed, because it throttled the side of the market that Founders pay for.
- **Pro-only outreach to Contributors.** Rejected: it's LinkedIn's model, and it's easy to get around off-platform.
- **Featured placement in Opportunities.** Rejected even though it would be a real revenue line. Paid ranking undermines the reason talent trusts the list.
- **A success fee per accepted Offer.** Deferred: it matches the value best, but it's hard to price and to enforce at launch.

## Consequences

- Pro only raises limits that grow with a Startup: Trial Cycle Capacity, open Roles, live Trial Cycles and Members, plus Stealth. The numbers live in `convex/lib/limits.ts`, and the pricing page lists only limits the backend actually enforces. Free is kept simple: no trials, no introductory tiers.
- A downgrade never takes away anything that already exists. It only blocks creating more beyond the Free limits. A Startup is never made public automatically.
- The subscription stays with the Founder who paid for it. There's no billing handover; Founders sort that out between themselves.
- Campus and incubator promotions are Dodo discount codes handed out in person, with an expiry and a usage limit. The app only needs to let customers type a code at checkout.
