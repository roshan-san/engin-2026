import type { HackathonDraft } from "./draft";

/** The saved fields of a draft, as stable text. Card `key`s only keep form rows apart, so they're left out. */
function fingerprint(draft: HackathonDraft): string {
	return JSON.stringify({
		job: draft.job,
		problem: draft.problem,
		weeks: draft.weeks,
		startsAt: draft.startsAt,
		participantsGet: draft.participantsGet,
		cards: draft.cards.map(({ title, notes }) => ({ title, notes })),
	});
}

/**
 * Whether leaving the form should ask first: the draft differs from what it opened with, and it
 * isn't being saved or published right now (that save navigates away) or already saved.
 */
export function shouldBlockLeave(
	draft: HackathonDraft,
	initial: HackathonDraft,
	pending: "save" | "publish" | null,
	saved: boolean,
): boolean {
	if (pending !== null || saved) return false;
	return fingerprint(draft) !== fingerprint(initial);
}
