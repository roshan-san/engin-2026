import { displayName } from "~/features/work/cards/displayName";

type Person = { _id: string; name: string | null; username: string | null };

export type PresenceEntry = {
	readonly user: Person;
	readonly workingOn: {
		readonly cardId: string;
		readonly title: string;
	} | null;
};

/** Everyone online once, with the viewer first and the rest as they came. */
export function orderPresence<T extends PresenceEntry>(
	entries: readonly T[],
	viewerId: string,
): T[] {
	const seen = new Set<string>();
	const unique = entries.filter((entry) => {
		if (seen.has(entry.user._id)) return false;
		seen.add(entry.user._id);
		return true;
	});
	return [
		...unique.filter((entry) => entry.user._id === viewerId),
		...unique.filter((entry) => entry.user._id !== viewerId),
	];
}

/** A person's tooltip: "Sam · In progress · Onboarding emails", or just "Sam". */
export function presenceLabel(entry: PresenceEntry): string {
	const name = displayName(entry.user);
	return entry.workingOn
		? `${name} · In progress · ${entry.workingOn.title}`
		: name;
}
