# Score counts only Founder-confirmed evidence

Score is Engin's core trust signal, so nothing a Participant does alone can raise it. Joining and sitting in a Trial Cycle earns nothing (only a passed Verdict does), a Pulse marked done by its assignee is merely Submitted until a Member verifies it, and team conversions count only Offers accepted from Trial Cycles, not Invites. Closing a Trial Cycle therefore requires a Verdict for every Participant and a decision on every Submitted Pulse.

## Considered Options

Counting self-marked pulses and "completed" (closed) trials was the original implementation; it let anyone farm Score by joining open-admission Trial Cycles. Removing open admission was rejected in favour of gating Score on Verdicts.

## Consequences

Weights: passed Verdict +80, Verified Pulse +10, accepted Offer +120, Leaving an active Trial Cycle −40 (floor 0). Leaving is public on the profile; Founder Cancellation carries no penalty.
