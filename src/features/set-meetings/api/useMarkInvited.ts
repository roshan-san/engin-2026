import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Records that the Founder created the meetings for everyone on the team now. */
export function useMarkInvited(startupId: Id<"startups">) {
	const markInvited = useMutation(api.cycles.markInvited);

	return () => attempt(() => markInvited({ startupId }));
}
