import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Marks someone off for the week being planned, or back on. */
export function useSetOff(startupId: Id<"startups">) {
	const setOff = useMutation(api.cycles.setOff);

	return (userId: Id<"users">, off: boolean) =>
		attempt(() => setOff({ startupId, userId, off }));
}
