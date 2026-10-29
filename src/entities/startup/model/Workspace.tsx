import type { Doc, Id } from "@convex/_generated/dataModel";
import { createContext, useContext } from "react";

export type Workspace = {
	readonly startup: Doc<"startups">;
	readonly role: "founder" | "contributor";
	readonly isFounder: boolean;
	readonly userId: Id<"users">;
};

export const StartupContext = createContext<Workspace | null>(null);

/** The Startup being worked in, and who you are on it. Only inside `/s/$slug`. */
export function useWorkspace(): Workspace {
	const workspace = useContext(StartupContext);
	if (!workspace) {
		throw new Error("useWorkspace needs a Startup");
	}
	return workspace;
}
