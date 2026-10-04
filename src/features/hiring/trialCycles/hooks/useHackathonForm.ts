import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { StartingPulseDraft } from "~/features/hiring/trialCycles/components/StartingPulsesField";
import type { TrialScheduleValue } from "~/features/hiring/trialCycles/components/TrialScheduleFields";
import { hackathonSchema } from "~/features/hiring/trialCycles/schemas/hackathon";
import { toDateTimeInput } from "~/lib/dates";
import { toErrorMessage, validate } from "~/lib/validation";

/** The form's own strings; `hackathonSchema` turns them into mutation args. */
export type HackathonFormValues = {
	readonly roleId: string;
	readonly title: string;
	readonly description: string;
	readonly maxContributors: string;
	readonly schedule: TrialScheduleValue;
	readonly prize: string;
	readonly expectedOutcome: string;
	readonly evaluationCriteria: string;
	readonly compensation: string;
	readonly challenges: readonly StartingPulseDraft[];
};

/** "Save for later" returns to Hiring; "Continue to publish" saves, then opens the publish dialog. */
export type SubmitIntent = "save" | "publish";

/** A new hackathon starts tomorrow at 10:00 local time and runs seven days. */
export function defaultHackathonValues(): HackathonFormValues {
	const start = new Date();
	start.setDate(start.getDate() + 1);
	start.setHours(10, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + 7);

	return {
		roleId: "",
		title: "",
		description: "",
		maxContributors: "5",
		schedule: {
			startsAt: toDateTimeInput(start.getTime()),
			endsAt: toDateTimeInput(end.getTime()),
			applicationDeadline: "",
		},
		prize: "",
		expectedOutcome: "",
		evaluationCriteria: "",
		compensation: "",
		challenges: [],
	};
}

type UseHackathonFormOptions = {
	readonly slug: string;
	readonly startupId: Id<"startups">;
	/** Set when editing a draft; absent when creating one. */
	readonly trialCycleId?: Id<"trialCycles">;
	readonly initialValues: HackathonFormValues;
};

/** Create or edit a draft in one save: fields and Starting Pulses together. */
export function useHackathonForm({
	slug,
	startupId,
	trialCycleId,
	initialValues,
}: UseHackathonFormOptions) {
	const createDraft = useMutation(api.hiring.trialCycles.create);
	const updateDraft = useMutation(api.hiring.trialCycles.update);
	const navigate = useNavigate();
	const [values, setValues] = useState(initialValues);
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);
	// Once the first save creates the draft, every later save edits it.
	const [savedId, setSavedId] = useState(trialCycleId);
	const [isPublishOpen, setIsPublishOpen] = useState(false);
	// State updates land a render late; the ref stops a double click saving twice.
	const pendingRef = useRef(false);

	function setField<Key extends keyof HackathonFormValues>(
		key: Key,
		value: HackathonFormValues[Key],
	) {
		setValues((current) => ({ ...current, [key]: value }));
	}

	async function onSubmit(intent: SubmitIntent) {
		if (pendingRef.current) {
			return;
		}
		const parsed = validate(hackathonSchema, {
			...values,
			...values.schedule,
			challenges: values.challenges.map(({ title, description }) => ({
				title,
				description,
			})),
		});
		if (!parsed.ok) {
			setError(parsed.message);
			toast.error(parsed.message);
			return;
		}

		pendingRef.current = true;
		setIsPending(true);
		setError(null);
		try {
			let draftId = savedId;
			if (draftId) {
				await updateDraft({ trialCycleId: draftId, ...parsed.data });
			} else {
				draftId = await createDraft({ startupId, ...parsed.data });
				setSavedId(draftId);
			}
			if (intent === "publish") {
				setIsPublishOpen(true);
				pendingRef.current = false;
				setIsPending(false);
				return;
			}
			toast.success("Saved for later");
			// Stay pending: the page is leaving, so a second click can't create another.
			await navigate({ to: "/s/$slug/hiring", params: { slug } });
		} catch (saveError) {
			const message = toErrorMessage(saveError, "Could not save the hackathon");
			setError(message);
			toast.error(message);
			pendingRef.current = false;
			setIsPending(false);
		}
	}

	function onPublished() {
		void navigate({ to: "/s/$slug/hiring", params: { slug } });
	}

	return {
		values,
		setField,
		error,
		isPending,
		onSubmit,
		savedId,
		isPublishOpen,
		setIsPublishOpen,
		onPublished,
	};
}
