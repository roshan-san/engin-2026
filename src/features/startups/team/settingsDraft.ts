import type { Doc } from "@convex/_generated/dataModel";

type SettingsStartup = Pick<
	Doc<"startups">,
	"name" | "oneLiner" | "website" | "stage" | "category" | "city"
>;

/** The settings form: text fields as typed, chips as picked. The logo saves on upload, not here. */
export type SettingsDraft = {
	name: string;
	oneLiner: string;
	website: string;
	stage: Doc<"startups">["stage"];
	category: Doc<"startups">["category"];
	city: Doc<"startups">["city"];
};

export function toSettingsDraft(startup: SettingsStartup): SettingsDraft {
	return {
		name: startup.name,
		oneLiner: startup.oneLiner ?? "",
		website: startup.website ?? "",
		stage: startup.stage,
		category: startup.category,
		city: startup.city,
	};
}

/**
 * The fields that differ from the saved Startup, for `startups.update`. Text is
 * trimmed; a blank one line or website is sent as `""`, which the server turns
 * into "removed" (`limitText` / `assertUrl` give `undefined` for blank).
 */
export function toUpdateArgs(
	draft: SettingsDraft,
	startup: SettingsStartup,
): Partial<SettingsDraft> {
	const saved = toSettingsDraft(startup);
	const next: SettingsDraft = {
		...draft,
		name: draft.name.trim(),
		oneLiner: draft.oneLiner.trim(),
		website: draft.website.trim(),
	};

	const changed: Partial<SettingsDraft> = {};
	for (const key of Object.keys(next) as (keyof SettingsDraft)[]) {
		if (next[key] !== saved[key]) {
			Object.assign(changed, { [key]: next[key] });
		}
	}
	return changed;
}
