import type { Doc } from "../_generated/dataModel";
import { isProvisional, type PublicUser, toPublicUser } from "../users/model";

export type TeamPerson = PublicUser & {
	ratingChange: number;
	isProvisional: boolean;
};

/** A person on the team: who they are and their Rating. */
export function toTeamPerson(user: Doc<"users">): TeamPerson {
	return {
		...toPublicUser(user),
		ratingChange: user.ratingChange ?? 0,
		isProvisional: isProvisional(user),
	};
}
