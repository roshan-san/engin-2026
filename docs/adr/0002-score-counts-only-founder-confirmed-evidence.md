# Score counts only Founder-confirmed evidence

Score is Engin's core trust signal, so nothing a Participant does alone can raise it. Joining and sitting in a Trial Cycle earns nothing (only a passed Verdict does), and team conversions count only Offers accepted from Trial Cycles, not Invites.

## Considered Options

Counting self-marked pulses and "completed" (closed) trials was the original implementation; it let anyone farm Score by joining open-admission Trial Cycles. Removing open admission was rejected in favour of gating Score on Verdicts.

## Amendment (2026-09-26): Pulses no longer count

Originally each Verified trial Pulse was worth +10 and closing a Trial Cycle required a decision on every Submitted Pulse. Two changes made that untenable:

- **Per-participant Boards** (ADR 0003): Participants create and split their own Pulses, so a per-Pulse reward invites splitting work into many trivial Pulses and buries Founders in reviews. The Verdict already judges the whole Submission, so trial Pulses are now a record of *how* someone worked, with no per-Pulse review.
- **Internal Cycles** have a real review → done gate, but it is not a Score source: anyone can create a Startup, Invite friends and verify their Pulses. Internal Verified Pulses appear on the profile as Proof of Work only.

Revisit counting internal work once Startup verification exists.

## Consequences

Weights: passed Verdict +80, accepted Offer +120, Leaving an active Trial Cycle −40 (floor 0). Leaving is public on the profile; Founder Cancellation carries no penalty. Closing a Trial Cycle requires a Verdict for every Participant.
