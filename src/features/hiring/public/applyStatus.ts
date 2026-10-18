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
	applied: "Applied.",
	participating: "You're in.",
	declined: "Not this time. Thanks for applying.",
} as const;

/** What the top bar offers for each state: the panel, the Board, or nothing. */
export type ApplyBarAction =
	| { kind: "panel"; label: "Apply" | "Your application" }
	| { kind: "board" };

export function applyBarAction(state: ApplyState): ApplyBarAction | null {
	switch (state) {
		case "form":
		case "sign_in":
			return { kind: "panel", label: "Apply" };
		case "applied":
		case "declined":
			return { kind: "panel", label: "Your application" };
		case "participating":
			return { kind: "board" };
		case "closed":
		case "team":
			return null;
	}
}

/** What the detail panel is called: Apply, your application, or just Details. */
export function applyPanelTitle(
	state: ApplyState,
): "Apply" | "Your application" | "Details" {
	const action = applyBarAction(state);
	return action?.kind === "panel" ? action.label : "Details";
}

export function closedLabel(status: "live" | "deciding" | "done"): string {
	if (status === "live") return "Live now";
	return status === "deciding" ? "Deciding" : "Finished";
}

/** Where an unsent answer waits in `localStorage`. */
export function answerKey(hackathonId: string): string {
	return `engin:apply:${hackathonId}`;
}
