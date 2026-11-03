import type { Id } from "@convex/_generated/dataModel";
import { type CardView, COLUMNS, type Column } from "~/entities/card";
import { type TeamPeople, teamRoleLine } from "~/entities/contributor";

/** One person's row on the Board, or the row of Cards nobody owns. */
export type Lane = {
	readonly id: string;
	readonly ownerId: Id<"users"> | null;
	readonly name: string;
	readonly role: string;
	readonly cards: CardView[];
};

const NO_OWNER = "none";

/** A lane per team member, the Founder first, even with no Cards; then "No owner" if any Card has none. */
export function groupIntoLanes(
	cards: readonly CardView[],
	team: TeamPeople,
): Lane[] {
	const cardsOf = (ownerId: Id<"users"> | null) =>
		cards.filter((card) => (card.owner?._id ?? null) === ownerId);
	const lanes: Lane[] = [];
	if (team.founder) {
		lanes.push({
			id: team.founder._id,
			ownerId: team.founder._id,
			name: team.founder.name ?? "Someone",
			role: "Founder",
			cards: cardsOf(team.founder._id),
		});
	}
	for (const person of team.contributors) {
		lanes.push({
			id: person._id,
			ownerId: person._id,
			name: person.name ?? "Someone",
			role: teamRoleLine(person),
			cards: cardsOf(person._id),
		});
	}
	const known = new Set(lanes.map((lane) => lane.id));
	const unowned = cards.filter(
		(card) => !card.owner || !known.has(card.owner._id),
	);
	if (unowned.length > 0) {
		lanes.push({
			id: NO_OWNER,
			ownerId: null,
			name: "No owner",
			role: "",
			cards: unowned,
		});
	}
	return lanes;
}

/** The lane a Card sits in. */
export function laneOf(card: CardView, lanes: readonly Lane[]): string {
	const ownerId = card.owner?._id;
	return lanes.some((lane) => lane.id === ownerId)
		? (ownerId as string)
		: NO_OWNER;
}

/** A droppable id for one column of one lane. */
export function laneDropId(laneId: string, column: Column): string {
	return `${laneId}:${column}`;
}

const COLUMN_IDS = new Set<string>(COLUMNS.map((column) => column.id));

export function parseLaneDropId(
	id: string,
): { laneId: string; column: Column } | null {
	const at = id.lastIndexOf(":");
	if (at < 0) return null;
	const column = id.slice(at + 1);
	return COLUMN_IDS.has(column)
		? { laneId: id.slice(0, at), column: column as Column }
		: null;
}

/** Where a drop on `overId` lands `card`; `otherLane` when it's another person's row. `null` off any column. */
export function resolveDrop(
	overId: string,
	card: CardView,
	lanes: readonly Lane[] | null,
): { column: Column; otherLane: boolean } | null {
	const inLane = parseLaneDropId(overId);
	if (inLane) {
		const otherLane = lanes !== null && inLane.laneId !== laneOf(card, lanes);
		return { column: inLane.column, otherLane };
	}
	return COLUMN_IDS.has(overId)
		? { column: overId as Column, otherLane: false }
		: null;
}
