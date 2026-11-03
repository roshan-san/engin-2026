import { MIN_HACKATHON_CARDS } from "@convex/hackathons/rules";
import type { Discipline } from "~/shared/config/disciplines";
import type { Job, JobMode, JobPay } from "~/shared/config/jobs";
import { startOptions } from "./startOptions";

export const PARTICIPANTS_GET = [
	"Nothing",
	"₹1,000 per finalist",
	"₹3,000 per finalist",
	"₹5,000 to the hire",
] as const;

/** A Hackathon being written. Chips start unpicked; Cards are added one at a time, as on the Board. */
export type HackathonDraft = {
	job: {
		title: string;
		discipline: Discipline | null;
		pay: JobPay | null;
		mode: JobMode | null;
	};
	problem: string;
	weeks: 1 | 2;
	startsAt: number | null;
	participantsGet: { choice: string; custom: string };
	/** `key` only keeps form rows apart; it isn't saved. */
	cards: { key: string; title: string; notes: string }[];
};

export function draftCard(title = "", notes = "") {
	return { key: crypto.randomUUID(), title, notes };
}

export function emptyDraft(now: number): HackathonDraft {
	return {
		job: { title: "", discipline: null, pay: null, mode: null },
		problem: "",
		weeks: 1,
		startsAt: startOptions(now)[0].startsAt,
		participantsGet: { choice: "", custom: "" },
		cards: [],
	};
}

/** What's stored for a "What Builders get" pick: a chip's label ("Nothing" included) or the custom line; undefined until there's a choice. */
export function toParticipantsGet(
	choice: string,
	custom: string,
): string | undefined {
	if (choice === "Custom") return custom.trim() || undefined;
	return choice || undefined;
}

export function fromParticipantsGet(value: string | null): {
	choice: string;
	custom: string;
} {
	if (!value) return { choice: "Nothing", custom: "" };
	return (PARTICIPANTS_GET as readonly string[]).includes(value)
		? { choice: value, custom: "" }
		: { choice: "Custom", custom: value };
}

/** What's still to fill in before the draft can be saved, in form order. */
export function missingParts(draft: HackathonDraft): string[] {
	const { title, discipline, pay, mode } = draft.job;
	const untitled = draft.cards.filter((card) => !card.title.trim()).length;
	return [
		title.trim() ? null : "a title",
		discipline === null ? "a discipline" : null,
		pay === null ? "the pay" : null,
		mode === null ? "where" : null,
		draft.problem.trim() ? null : "the problem",
		untitled > 0 ? (untitled === 1 ? "a Card title" : "Card titles") : null,
		draft.cards.length < MIN_HACKATHON_CARDS
			? `at least ${MIN_HACKATHON_CARDS} Cards`
			: null,
		draft.startsAt === null ? "a start" : null,
		toParticipantsGet(
			draft.participantsGet.choice,
			draft.participantsGet.custom,
		) === undefined
			? "what Builders get"
			: null,
	].filter((part) => part !== null);
}

export function isDraftReady(draft: HackathonDraft): boolean {
	return missingParts(draft).length === 0;
}

/** The draft as `hackathons.create` / `update` args. Call only when ready. */
export function toDraftArgs(draft: HackathonDraft) {
	const { title, discipline, pay, mode } = draft.job;
	if (
		!title.trim() ||
		!discipline ||
		!pay ||
		!mode ||
		draft.startsAt === null
	) {
		throw new Error("Finish the form first");
	}
	const participantsGet = toParticipantsGet(
		draft.participantsGet.choice,
		draft.participantsGet.custom,
	);
	if (participantsGet === undefined) {
		throw new Error("Finish the form first");
	}
	const job: Job = { title: title.trim(), discipline, pay, mode };
	return {
		job,
		problem: draft.problem.trim(),
		weeks: draft.weeks,
		startsAt: draft.startsAt,
		participantsGet,
		cards: draft.cards.map((card) => ({
			title: card.title.trim(),
			notes: card.notes.trim() || undefined,
		})),
	};
}
