import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { StarterTaskDraft } from "~/features/hiring/hackathons/components/StarterTasksField";
import type { HackathonScheduleValue } from "~/features/hiring/hackathons/components/HackathonScheduleFields";
import { hackathonSchema } from "~/features/hiring/hackathons/schemas/hackathon";
import { toDateTimeInput } from "~/lib/dates";
import { toErrorMessage, validate } from "~/lib/validation";

/** The form's own strings; `hackathonSchema` turns them into mutation args. */
export type HackathonFormValues = {
	readonly roleId: string;
	readonly title: string;
	readonly description: string;
	readonly maxParticipants: string;
	readonly schedule: HackathonScheduleValue;
	readonly prize: string;
	readonly expectedOutcome: string;
	readonly evaluationCriteria: string;
	readonly compensation: string;
	readonly starterTasks: readonly StarterTaskDraft[];
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
		maxParticipants: "5",
		schedule: {
			startsAt: toDateTimeInput(start.getTime()),
			endsAt: toDateTimeInput(end.getTime()),
			applicationDeadline: "",
		},
		prize: "",
		expectedOutcome: "",
		evaluationCriteria: "",
		compensation: "",
		starterTasks: [],
	};
}

type UseHackathonFormOptions = {
	readonly slug: string;
	readonly startupId: Id<"startups">;
	/** Set when editing a draft; absent when creating one. */
	readonly hackathonId?: Id<"hackathons">;
	readonly initialValues: HackathonFormValues;
};

/** Create or edit a draft in one save: fields and Starter Tasks together. */
export function useHackathonForm({
	slug,
	startupId,
	hackathonId,
	initialValues,
}: UseHackathonFormOptions) {
	const createDraft = useMutation(api.hiring.hackathons.create);
	const updateDraft = useMutation(api.hiring.hackathons.update);
	const navigate = useNavigate();
	const [values, setValues] = useState(initialValues);
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);
	// Once the first save creates the draft, every later save edits it.
	const [savedId, setSavedId] = useState(hackathonId);
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
			starterTasks: values.starterTasks.map(({ title, description }) => ({
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
				await updateDraft({ hackathonId: draftId, ...parsed.data });
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
