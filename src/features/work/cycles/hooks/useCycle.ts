import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

type CycleAction = "start" | "close" | "members";

/** One Cycle's screen data and the Founder's lifecycle and member actions. */
export function useCycle(cycleId: Id<"cycles">) {
	const view = useQuery(api.work.cycles.get, { cycleId });
	const startCycle = useMutation(api.work.cycles.start);
	const closeCycle = useMutation(api.work.cycles.close);
	const addMember = useMutation(api.work.cycles.addMember);
	const removeMember = useMutation(api.work.cycles.removeMember);
	const [pending, setPending] = useState<CycleAction | null>(null);

	async function run(
		action: CycleAction,
		fallback: string,
		call: () => Promise<unknown>,
	): Promise<boolean> {
		setPending(action);
		try {
			await call();
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, fallback));
			return false;
		} finally {
			setPending(null);
		}
	}

	return {
		view,
		pending,
		start: () =>
			run("start", "Could not start Cycle", () => startCycle({ cycleId })),
		close: (carryOverToCycleId: Id<"cycles"> | null) =>
			run("close", "Could not close Cycle", () =>
				closeCycle({
					cycleId,
					carryOverToCycleId: carryOverToCycleId ?? undefined,
				}),
			),
		setMember: (userId: Id<"users">, isMember: boolean) =>
			run("members", "Could not update Cycle Members", () =>
				isMember
					? addMember({ cycleId, userId })
					: removeMember({ cycleId, userId }),
			),
	};
}

/** The Startup's team, for picking Cycle Members; skipped until needed. */
export function useTeamMembers(startupId: Id<"startups"> | undefined) {
	const members = useQuery(
		api.teams.members.list,
		startupId ? { startupId } : "skip",
	);
	return { members };
}
