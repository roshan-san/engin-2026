import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
	NEW_DATES_MESSAGE,
	NO_STARTING_PULSE_MESSAGE,
} from "@convex/hiring/publish.rules";
import { useAction, useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { TrialScheduleValue } from "~/features/hiring/trialCycles/components/TrialScheduleFields";
import { scheduleSchema } from "~/features/hiring/trialCycles/schemas/hackathon";
import { useUpgrade } from "~/features/marketing/pricing/hooks/useUpgrade";
import { toErrorMessage, validate } from "~/lib/validation";

/** The fix the dialog offers beside a refusal; stealth and others get none. */
export type PublishFix = "dates" | "edit" | null;

function fixFor(message: string | null): PublishFix {
	if (message === NEW_DATES_MESSAGE) {
		return "dates";
	}
	if (message === NO_STARTING_PULSE_MESSAGE) {
		return "edit";
	}
	return null;
}

type UsePublishHackathonOptions = {
	readonly slug: string;
	readonly trialCycleId: Id<"trialCycles">;
	readonly onPublished: () => void;
};

/**
 * Publish with a credit, or pay for one through Dodo. Errors appear only
 * after a click and are the backend's words; the click order is the check order.
 */
export function usePublishHackathon({
	slug,
	trialCycleId,
	onPublished,
}: UsePublishHackathonOptions) {
	const publishTrial = useMutation(api.hiring.trialCycles.publish);
	const reschedule = useMutation(api.hiring.trialCycles.reschedule);
	const createCheckout = useAction(
		api.billing.checkout.createHackathonCheckout,
	);
	const { plan, upgrade, isLoading: isUpgrading } = useUpgrade();
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);
	// State lands a render late; the ref stops a double click sending twice.
	const pendingRef = useRef(false);

	async function run(action: () => Promise<void>, fallback: string) {
		if (pendingRef.current) {
			return;
		}
		pendingRef.current = true;
		setIsPending(true);
		setError(null);
		try {
			await action();
		} catch (actionError) {
			setError(toErrorMessage(actionError, fallback));
		} finally {
			pendingRef.current = false;
			setIsPending(false);
		}
	}

	function publish() {
		return run(async () => {
			await publishTrial({ trialCycleId, acceptTerms: true });
			toast.success("Published. Your hackathon is live.");
			onPublished();
		}, "Could not publish the hackathon");
	}

	function pay() {
		return run(async () => {
			const { checkoutUrl } = await createCheckout({
				trialCycleId,
				acceptTerms: true,
				returnUrl: `${window.location.origin}/s/${slug}/hiring`,
			});
			window.location.href = checkoutUrl;
		}, "Could not start checkout");
	}

	function saveDates(schedule: TrialScheduleValue) {
		const parsed = validate(scheduleSchema, schedule);
		if (!parsed.ok) {
			setError(parsed.message);
			return Promise.resolve();
		}
		return run(async () => {
			await reschedule({ trialCycleId, ...parsed.data });
			toast.success("New dates saved. You can publish now.");
		}, "Could not save the new dates");
	}

	return {
		error,
		fix: fixFor(error),
		isPending,
		isPro: plan?.isPro ?? false,
		publish,
		pay,
		saveDates,
		goPro: () =>
			void upgrade("monthly", `${window.location.origin}/s/${slug}/hiring`),
		isUpgrading,
		clearError: () => setError(null),
	};
}
