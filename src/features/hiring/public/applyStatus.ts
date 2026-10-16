type HackathonStatus = "draft" | "open" | "live" | "deciding" | "done";
type ApplicationStatus = "applied" | "declined" | "participating";

export type ApplyState =
	| "sign_in"
	| "team"
	| "form"
	| "applied"
	| "participating"
	| "declined"
	| "closed";

/** What the Apply card shows: your application first, then whether you can apply. */
export function applyState(
	page: {
		status: HackathonStatus;
		isTeam: boolean;
		myApplication: { status: ApplicationStatus } | null;
	},
	isSignedIn: boolean,
): ApplyState {
	const mine = page.myApplication?.status;
	if (mine) return mine;
	if (page.status !== "open") return "closed";
	if (!isSignedIn) return "sign_in";
	return page.isTeam ? "team" : "form";
}

export const APPLY_COPY = {
	applied: "Sent. You'll hear before it starts.",
	participating: "You're in.",
	declined: "Not this time. Thanks for applying.",
} as const;

export function closedLabel(status: "live" | "deciding" | "done"): string {
	return status === "live" ? "Live now" : "Finished";
}

/** Where an unsent answer waits in `localStorage`. */
export function answerKey(hackathonId: string): string {
	return `engin:apply:${hackathonId}`;
}
