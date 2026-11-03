import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Opens the Board after the opening meeting. Resolves `false` when refused (the reason is toasted). */
export function useStartWeek(startupId: Id<"startups">) {
	const startWeek = useMutation(api.cycles.startWeek);

	return () => attempt(() => startWeek({ startupId }));
}
