import type { Doc } from "../_generated/dataModel";
import { isProvisional, type PublicUser, toPublicUser } from "../users/model";

export type TeamPerson = PublicUser & {
	momentumChange: number;
	isProvisional: boolean;
};

/** A person on the team: who they are and their Momentum. */
export function toTeamPerson(user: Doc<"users">): TeamPerson {
	return {
		...toPublicUser(user),
		momentumChange: user.momentumChange ?? 0,
		isProvisional: isProvisional(user),
	};
}
