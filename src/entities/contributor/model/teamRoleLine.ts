import { type Discipline, disciplineLabel } from "~/shared/config/disciplines";

/** "Marketing · Growth lead": a Contributor's team role. */
export function teamRoleLine(role: {
	readonly discipline: Discipline;
	readonly label: string | null;
}): string {
	return [disciplineLabel(role.discipline), role.label]
		.filter((part) => part !== null)
		.join(" · ");
}
