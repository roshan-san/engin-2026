import type { Id } from "@convex/_generated/dataModel";
import type { HackathonPhase } from "@convex/hackathons/rules";
import { createContext, useContext } from "react";

/**
 * Whose Board is showing: a Startup's, or one Participant's Cards on a Hackathon.
 * It is also the actor the Card rules judge: who you are and where the Hackathon is.
 */
export type BoardScope =
	| {
			readonly kind: "startup";
			readonly startupId: Id<"startups">;
			readonly slug: string;
			readonly userId: Id<"users">;
			readonly role: "founder" | "contributor";
			readonly phase: null;
	  }
	| {
			readonly kind: "participant";
			readonly hackathonId: Id<"hackathons">;
			readonly participantId: Id<"users">;
			readonly userId: Id<"users">;
			/** The Founder, or the Participant whose Board it is. */
			readonly role: "founder" | "participant";
			readonly phase: HackathonPhase;
	  };

export const BoardScopeContext = createContext<BoardScope | null>(null);

/** The Board being worked on. Inside a Startup workspace or a Hackathon Board. */
export function useBoardScope(): BoardScope {
	const scope = useContext(BoardScopeContext);
	if (!scope) {
		throw new Error("useBoardScope needs a Board");
	}
	return scope;
}

/** Which Cards query a scope reads, with its args. */
export function boardQuery(scope: BoardScope):
	| { kind: "startup"; args: { startupId: Id<"startups"> } }
	| {
			kind: "participant";
			args: { hackathonId: Id<"hackathons">; participantId: Id<"users"> };
	  } {
	return scope.kind === "startup"
		? { kind: "startup", args: { startupId: scope.startupId } }
		: {
				kind: "participant",
				args: {
					hackathonId: scope.hackathonId,
					participantId: scope.participantId,
				},
			};
}
