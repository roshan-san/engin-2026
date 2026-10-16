import type { Infer } from "convex/values";
import type { jobRole } from "./validators";

type JobRole = Infer<typeof jobRole>;

/** One thing waiting on a person in a place. The server decides these; the browser words them. */
export type WaitingReason =
	| { kind: "team_unread" }
	| { kind: "cards_to_verify"; count: number }
	| { kind: "new_applicants"; role: JobRole; count: number }
	| { kind: "participant_cards_to_review"; role: JobRole; count: number }
	| { kind: "hackathon_unread"; role: JobRole }
	| { kind: "participants_to_decide"; role: JobRole; count: number }
	| { kind: "messages_unread" }
	| { kind: "promise_pending" };
