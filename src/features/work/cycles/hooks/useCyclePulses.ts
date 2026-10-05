import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { kanbanMove } from "~/features/work/cycles/lib/kanban";
import {
	inferProofLinkKind,
	type PulseStatus,
} from "~/features/work/pulses/constants";
import { toErrorMessage } from "~/lib/validation";

export type CyclePulse = FunctionReturnType<
	typeof api.work.pulses.listForCycle
>[number];

/** What a drop asked for: done, or a Founder's return that needs a note. */
export type MoveOutcome = "sent" | "needs_note" | "refused" | "none";

/** A Cycle's Pulses and every board action, with one pending Pulse at a time. */
export function useCyclePulses(cycleId: Id<"cycles">, isFounder: boolean) {
	const pulses = useQuery(api.work.pulses.listForCycle, { cycleId });
	const createPulse = useMutation(api.work.pulses.create);
	const assignToMe = useMutation(api.work.pulses.assignToMe);
	const setStatus = useMutation(api.work.pulses.setStatus);
	const verify = useMutation(api.work.pulses.verify);
	const reject = useMutation(api.work.pulses.reject);
	const updatePulse = useMutation(api.work.pulses.update);
	const removePulse = useMutation(api.work.pulses.remove);
	const addLink = useMutation(api.work.pulses.addProofLink);
	const removeLink = useMutation(api.work.pulses.removeProofLink);
	const [pendingId, setPendingId] = useState<Id<"pulses"> | "new" | null>(null);

	async function run(
		pulseId: Id<"pulses"> | "new",
		action: () => Promise<unknown>,
	): Promise<boolean> {
		setPendingId(pulseId);
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

	/** Sends an allowed move; a refused one is toasted with its rule. */
	function move(
		pulseId: Id<"pulses">,
		from: PulseStatus,
		to: PulseStatus,
	): MoveOutcome {
		const next = kanbanMove(from, to, isFounder);
		if (!next) {
			return "none";
		}
		if (next.kind === "refused") {
			toast.error(next.reason);
			return "refused";
		}
		if (next.kind === "return") {
			return "needs_note";
		}
		if (next.kind === "verify") {
			void run(pulseId, () => verify({ pulseId }));
			return "sent";
		}
		void run(pulseId, () => setStatus({ pulseId, status: next.status }));
		return "sent";
	}

	return {
		pulses,
		pendingId,
		move,
		returnWithNote: (pulseId: Id<"pulses">, note: string) =>
			run(pulseId, () => reject({ pulseId, note })),
		take: (pulseId: Id<"pulses">) =>
			run(pulseId, () => assignToMe({ pulseId })),
		create: (startupId: Id<"startups">, title: string) =>
			run("new", () => createPulse({ startupId, cycleId, title })),
		edit: (pulseId: Id<"pulses">, title: string, description: string) =>
			run(pulseId, () => updatePulse({ pulseId, title, description })),
		remove: (pulseId: Id<"pulses">) =>
			run(pulseId, () => removePulse({ pulseId })),
		verify: (pulseId: Id<"pulses">) => run(pulseId, () => verify({ pulseId })),
		addProofLink: (pulseId: Id<"pulses">, url: string) =>
			run(pulseId, () =>
				addLink({ pulseId, url, kind: inferProofLinkKind(url) }),
			),
		removeProofLink: (pulseId: Id<"pulses">, url: string) =>
			run(pulseId, () => removeLink({ pulseId, url })),
	};
}
