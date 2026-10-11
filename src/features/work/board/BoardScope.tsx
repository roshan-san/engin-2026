import type { Id } from "@convex/_generated/dataModel";
import { createContext, useContext } from "react";

/** Whose Board is showing: a Startup's, or one Builder's Cards on a Hackathon. */
export type BoardScope =
	| {
			readonly kind: "startup";
			readonly startupId: Id<"startups">;
			readonly slug: string;
			readonly userId: Id<"users">;
			readonly isFounder: boolean;
	  }
	| {
			readonly kind: "builder";
			readonly hackathonId: Id<"hackathons">;
			readonly builderId: Id<"users">;
			readonly userId: Id<"users">;
			readonly isFounder: boolean;
			/** The Hackathon is over for this viewer: the Cards are read-only. */
			readonly isClosed: boolean;
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
			kind: "builder";
			args: { hackathonId: Id<"hackathons">; builderId: Id<"users"> };
	  } {
	return scope.kind === "startup"
		? { kind: "startup", args: { startupId: scope.startupId } }
		: {
				kind: "builder",
				args: { hackathonId: scope.hackathonId, builderId: scope.builderId },
			};
}

/** Whether the viewer can't change these Cards any more. */
export function isReadOnly(scope: BoardScope): boolean {
	return scope.kind === "builder" && scope.isClosed;
}
