/** How a person is named in the panel: their name, else their username. */
export function displayName(
	person: { name: string | null; username: string | null } | null,
): string {
	return person?.name ?? person?.username ?? "Someone";
}
