import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { roleLabel } from "~/shared/config/jobs";
import { dateRange } from "~/shared/lib/dates";
import { displayName } from "~/shared/lib/displayName";

export type ActivityView = FunctionReturnType<typeof api.work.activity.list>;
export type CycleView = ActivityView["cycles"][number];
export type EntryView = CycleView["entries"][number];

/** Who an entry is about and what happened; the actor reads in bold before `text`. */
export function entrySummary(entry: EntryView): {
	actor: string | null;
	text: string;
} {
	const actor = displayName(entry.actor);
	const job = entry.job ? roleLabel(entry.job.role) : "a job";
	switch (entry.kind) {
		case "card_verified":
			return { actor, text: entry.line ?? "Shipped a Card" };
		case "contributor_joined":
			return { actor, text: "joined as a Contributor" };
		case "hackathon_finished":
			return { actor: null, text: `Hackathon finished · ${job}` };
		case "participant_hired":
			return { actor, text: `was hired · ${job}` };
	}
}

/** A loaded entry and the Cycle it sits in, or null once it's out of the list. */
export function findEntry(cycles: CycleView[], entryId: string | undefined) {
	if (!entryId) return null;
	for (const cycle of cycles) {
		const entry = cycle.entries.find((e) => e.id === entryId);
		if (entry) return { entry, cycle };
	}
	return null;
}

/** A proof link without its scheme: "github.com/acme/app/pull/12". */
export function linkLabel(url: string): string {
	try {
		const { host, pathname, search } = new URL(url);
		const path = pathname === "/" ? "" : pathname.replace(/\/$/, "");
		return `${host.replace(/^www\./, "")}${path}${search}`;
	} catch {
		return url;
	}
}

export type FeedItem =
	| { kind: "cycle"; cycle: CycleView; isCurrent: boolean }
	| { kind: "quiet"; newest: CycleView; oldest: CycleView };

/**
 * The feed's rows, newest first. A run of finished Cycles with nothing in
 * them (no goal, nothing shipped) folds into one quiet row.
 */
export function buildFeed(cycles: CycleView[], now: number): FeedItem[] {
	const items: FeedItem[] = [];
	for (const cycle of cycles) {
		const isCurrent = cycle.startsAt <= now && now < cycle.endsAt;
		const isQuiet =
			!isCurrent &&
			cycle.shippedCount === 0 &&
			cycle.entries.length === 0 &&
			!cycle.goal;
		const last = items.at(-1);
		if (isQuiet && last?.kind === "quiet") {
			items[items.length - 1] = { ...last, oldest: cycle };
		} else if (isQuiet) {
			items.push({ kind: "quiet", newest: cycle, oldest: cycle });
		} else {
			items.push({ kind: "cycle", cycle, isCurrent });
		}
	}
	return items;
}

/** "Cycle 4" or "Cycles 2–4", with the dates they span. */
export function quietLabel(item: Extract<FeedItem, { kind: "quiet" }>) {
	const { newest, oldest } = item;
	return {
		name:
			newest.number === oldest.number
				? `Cycle ${newest.number}`
				: `Cycles ${oldest.number}–${newest.number}`,
		dates: dateRange(oldest.startsAt, newest.endsAt),
	};
}
