import type { discipline } from "@convex/schema";
import type { Infer } from "convex/values";

type Discipline = Infer<typeof discipline>;

/** The part of `users.getMe` the Settings form edits. */
export type ProfileSource = {
	readonly username: string | null;
	readonly discipline: Discipline | null;
	readonly bio: string | null;
	readonly links: {
		readonly linkedinUrl: string | null;
		readonly githubUrl: string | null;
		readonly portfolioUrl: string | null;
	};
};

/** The Settings form: text as typed, discipline as picked. */
export type ProfileDraft = {
	username: string;
	discipline: Discipline | null;
	bio: string;
	linkedinUrl: string;
	githubUrl: string;
	portfolioUrl: string;
};

export function toProfileDraft(me: ProfileSource): ProfileDraft {
	return {
		username: me.username ?? "",
		discipline: me.discipline,
		bio: me.bio ?? "",
		linkedinUrl: me.links.linkedinUrl ?? "",
		githubUrl: me.links.githubUrl ?? "",
		portfolioUrl: me.links.portfolioUrl ?? "",
	};
}

/**
 * The fields that differ from the saved profile, for `users.updateProfile`.
 * Text is trimmed and the username lowercased; a blank bio or link is sent as
 * `""`, which the server turns into "removed". A discipline can be changed, not cleared.
 */
export function toProfileArgs(
	draft: ProfileDraft,
	me: ProfileSource,
): Partial<Omit<ProfileDraft, "discipline">> & {
	discipline?: Discipline;
} {
	const saved = toProfileDraft(me);
	const next: ProfileDraft = {
		...draft,
		username: draft.username.trim().toLowerCase(),
		bio: draft.bio.trim(),
		linkedinUrl: draft.linkedinUrl.trim(),
		githubUrl: draft.githubUrl.trim(),
		portfolioUrl: draft.portfolioUrl.trim(),
	};

	const changed: ReturnType<typeof toProfileArgs> = {};
	for (const key of Object.keys(next) as (keyof ProfileDraft)[]) {
		if (next[key] !== saved[key] && next[key] !== null) {
			Object.assign(changed, { [key]: next[key] });
		}
	}
	return changed;
}
