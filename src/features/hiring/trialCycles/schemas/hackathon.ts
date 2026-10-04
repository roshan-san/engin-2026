import type { Id } from "@convex/_generated/dataModel";
import {
	CHALLENGE_TEXT_LIMITS,
	MAX_TRIAL_CHALLENGES,
	MAX_TRIAL_PARTICIPANTS,
	TRIAL_TEXT_LIMITS,
} from "@convex/lib/limits";
import { z } from "zod";
import { fromDateTimeInput } from "~/lib/dates";
import { optionalText, requiredText } from "~/lib/validation";

function dateTime(message: string) {
	return z.string().min(1, message).transform(fromDateTimeInput);
}

const participantsMessage = `Max participants must be a whole number from 1 to ${MAX_TRIAL_PARTICIPANTS}`;

/**
 * Mirrors the backend draft rules for instant feedback; the server still
 * decides. Input is the form's strings, output is `create`/`update` args.
 */
export const hackathonSchema = z
	.object({
		roleId: z
			.string()
			.min(1, "Pick a Role")
			.transform((value) => value as Id<"roles">),
		title: requiredText("Title", TRIAL_TEXT_LIMITS.title),
		description: requiredText("Description", TRIAL_TEXT_LIMITS.description),
		maxContributors: z.coerce
			.number(participantsMessage)
			.int(participantsMessage)
			.min(1, participantsMessage)
			.max(MAX_TRIAL_PARTICIPANTS, participantsMessage),
		startsAt: dateTime("Pick a start date and time"),
		endsAt: dateTime("Pick an end date and time"),
		applicationDeadline: z
			.string()
			.transform((value) => (value ? fromDateTimeInput(value) : undefined)),
		prize: optionalText("Prize", TRIAL_TEXT_LIMITS.prize),
		expectedOutcome: optionalText("Expected outcome", TRIAL_TEXT_LIMITS.detail),
		evaluationCriteria: optionalText(
			"Evaluation criteria",
			TRIAL_TEXT_LIMITS.detail,
		),
		compensation: optionalText("Compensation", TRIAL_TEXT_LIMITS.detail),
		challenges: z
			.array(
				z.object({
					title: requiredText(
						"Starting Pulse title",
						CHALLENGE_TEXT_LIMITS.title,
					),
					description: optionalText(
						"Starting Pulse description",
						CHALLENGE_TEXT_LIMITS.description,
					),
				}),
			)
			.max(
				MAX_TRIAL_CHALLENGES,
				`A hackathon can have at most ${MAX_TRIAL_CHALLENGES} Starting Pulses`,
			),
	})
	.refine((draft) => draft.endsAt > draft.startsAt, {
		message: "The end must be after the start",
	})
	.refine((draft) => draft.startsAt > Date.now(), {
		message: "Pick a start time in the future",
	})
	.refine(
		(draft) =>
			draft.applicationDeadline === undefined ||
			draft.applicationDeadline > Date.now(),
		{ message: "Pick an application deadline in the future" },
	)
	.refine(
		(draft) =>
			draft.applicationDeadline === undefined ||
			draft.applicationDeadline <= draft.startsAt,
		{ message: "The application deadline must be before the start" },
	);

export type HackathonDraft = z.output<typeof hackathonSchema>;

/** The publish dialog's "pick new dates" fix: `reschedule` args from the date fields. */
export const scheduleSchema = z
	.object({
		startsAt: dateTime("Pick a start date and time"),
		endsAt: dateTime("Pick an end date and time"),
		applicationDeadline: z
			.string()
			.transform((value) => (value ? fromDateTimeInput(value) : undefined)),
	})
	.refine((schedule) => schedule.endsAt > schedule.startsAt, {
		message: "The end must be after the start",
	})
	.refine((schedule) => schedule.startsAt > Date.now(), {
		message: "Pick a start time in the future",
	})
	.refine(
		(schedule) =>
			schedule.applicationDeadline === undefined ||
			(schedule.applicationDeadline > Date.now() &&
				schedule.applicationDeadline <= schedule.startsAt),
		{
			message: "Pick an application deadline in the future, before the start",
		},
	);
