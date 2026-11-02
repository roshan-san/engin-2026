/** One thing waiting on a person in a place. The server decides these; the browser words them. */
export type WaitingReason =
	| { kind: "team_unread" }
	| { kind: "cards_to_verify"; count: number }
	| { kind: "new_applicants"; title: string; count: number }
	| { kind: "participant_cards_to_review"; title: string; count: number }
	| { kind: "hackathon_unread"; title: string }
	| { kind: "participants_to_decide"; title: string; count: number }
	| { kind: "messages_unread" }
	| { kind: "promise_pending" };
