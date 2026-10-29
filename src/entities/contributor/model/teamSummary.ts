/** The Team bar: "5 people · 1 invite pending". `invites` is `undefined` for a Contributor. */
export function teamSummary(
	people: number,
	invites: number | undefined,
): string {
	const who = `${people} ${people === 1 ? "person" : "people"}`;
	if (!invites) {
		return who;
	}
	return `${who} · ${invites} ${invites === 1 ? "invite" : "invites"} pending`;
}
