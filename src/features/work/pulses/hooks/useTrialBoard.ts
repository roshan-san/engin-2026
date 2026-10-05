import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	inferProofLinkKind,
	type PulseStatus,
} from "~/features/work/pulses/constants";
import { toErrorMessage } from "~/lib/validation";

type BoardTarget = {
	readonly startupId: Id<"startups">;
	readonly trialCycleId: Id<"trialCycles">;
	/** Someone else's Board, which only a Founder may read. */
	readonly participantUserId?: Id<"users">;
	/** False for anyone who has no Board to read (applicants, leavers). */
	readonly enabled: boolean;
};

/** A Trial Board (the viewer's own unless a Participant is named); every refusal shows the backend's words. */
export function useTrialBoard({
	startupId,
	trialCycleId,
	participantUserId,
	enabled,
}: BoardTarget) {
	const pulses = useQuery(
		api.work.pulses.listBoard,
		enabled ? { trialCycleId, participantUserId } : "skip",
	);
	const createPulse = useMutation(api.work.pulses.create);
	const updatePulse = useMutation(api.work.pulses.update);
	const setPulseStatus = useMutation(api.work.pulses.setStatus);
	const removePulse = useMutation(api.work.pulses.remove);
	const addLink = useMutation(api.work.pulses.addProofLink);
	const removeLink = useMutation(api.work.pulses.removeProofLink);
	/** The Pulse being changed, or "new" while one is being added. */
	const [pendingId, setPendingId] = useState<Id<"pulses"> | "new" | null>(null);

	async function run(
		id: Id<"pulses"> | "new",
		action: () => Promise<unknown>,
	): Promise<boolean> {
		if (pendingId) {
			return false;
		}
		setPendingId(id);
		try {
			await action();
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update Pulse"));
			return false;
		} finally {
			setPendingId(null);
		}
	}

	return {
		pulses,
		pendingId,
		create: (title: string) =>
			run("new", () => createPulse({ startupId, trialCycleId, title })),
		rename: (pulseId: Id<"pulses">, title: string) =>
			run(pulseId, () => updatePulse({ pulseId, title })),
		setStatus: (pulseId: Id<"pulses">, status: PulseStatus) =>
			run(pulseId, () => setPulseStatus({ pulseId, status })),
		remove: (pulseId: Id<"pulses">) =>
			run(pulseId, () => removePulse({ pulseId })),
		addProofLink: (pulseId: Id<"pulses">, url: string) =>
			run(pulseId, () =>
				addLink({ pulseId, url, kind: inferProofLinkKind(url) }),
			),
		removeProofLink: (pulseId: Id<"pulses">, url: string) =>
			run(pulseId, () => removeLink({ pulseId, url })),
	};
}
