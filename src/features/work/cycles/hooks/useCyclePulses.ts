import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { kanbanMove } from "~/features/work/cycles/lib/kanban";
import type { PulseStatus } from "~/features/work/pulses/constants";
import { toErrorMessage } from "~/lib/validation";

export function useCyclePulses(cycleId: Id<"cycles">, isFounder: boolean) {
	const pulses = useQuery(api.work.pulses.listForCycle, { cycleId });
	const setStatus = useMutation(api.work.pulses.setStatus);
	const verify = useMutation(api.work.pulses.verify);
	const reject = useMutation(api.work.pulses.reject);
	const [pendingId, setPendingId] = useState<Id<"pulses"> | null>(null);

	async function run(pulseId: Id<"pulses">, action: () => Promise<unknown>) {
		setPendingId(pulseId);
		try {
			await action();
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update Pulse"));
		} finally {
			setPendingId(null);
		}
	}

	function move(pulseId: Id<"pulses">, from: PulseStatus, to: PulseStatus) {
		const next = kanbanMove(from, to, isFounder);
		if (!next) {
			return;
		}
		if (next.kind === "refused") {
			toast.error(next.reason);
			return;
		}
		if (next.kind === "verify") {
			void run(pulseId, () => verify({ pulseId }));
			return;
		}
		if (next.kind === "return") {
			const note = window.prompt("What needs to change?");
			if (note?.trim()) {
				void run(pulseId, () => reject({ pulseId, note }));
			}
			return;
		}
		void run(pulseId, () => setStatus({ pulseId, status: next.status }));
	}

	return { pulses, pendingId, run, move };
}
