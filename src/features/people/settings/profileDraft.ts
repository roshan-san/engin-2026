import type { discipline } from "@convex/shared/validators";
import type { Infer } from "convex/values";
import { changedFields } from "~/lib/changedFields";

type Discipline = Infer<typeof discipline>;

/** The part of `users.getMe` the Settings form edits. */
export type ProfileSource = {
	readonly username: string | null;
	readonly discipline: Discipline | null;
	readonly bio: string | null;
};

/** The Settings form: text as typed, discipline as picked. */
export type ProfileDraft = {
	username: string;
	discipline: Discipline | null;
	bio: string;
};

export function toProfileDraft(me: ProfileSource): ProfileDraft {
	return {
		username: me.username ?? "",
		discipline: me.discipline,
		bio: me.bio ?? "",
	};
}

/**
 * The fields that differ from the saved profile, for `users.updateProfile`.
 * Text is trimmed and the username lowercased; a blank bio is sent as
 * `""`, which the server turns into "removed"; a cleared discipline is sent as `null`.
 */
export function toProfileArgs(
	draft: ProfileDraft,
	me: ProfileSource,
): Partial<ProfileDraft> {
	const saved = toProfileDraft(me);
	const next: ProfileDraft = {
		...draft,
		username: draft.username.trim().toLowerCase(),
		bio: draft.bio.trim(),
	};
	return changedFields(next, saved);
}

/**
 * Where to go after a save: the new username when the save renamed you and the
 * page is your own profile (so the old URL doesn't 404), otherwise nowhere.
 */
export function renamedProfileTarget(
	where: {
		/** The `/u/$username` in the URL, if the page is a profile. */
		readonly pageUsername: string | undefined;
		/** Your username before the save. */
		readonly savedUsername: string | null;
	},
	nextUsername: string | undefined,
): string | null {
	if (nextUsername === undefined || where.pageUsername === undefined) {
		return null;
	}
	return where.pageUsername.toLowerCase() === where.savedUsername
		? nextUsername
		: null;
}
