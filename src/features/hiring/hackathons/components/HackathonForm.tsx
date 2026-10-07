import type { Id } from "@convex/_generated/dataModel";
import { GOAL_MAX, MAX_HACKATHON_PARTICIPANTS } from "@convex/lib/limits";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { PublishDialog } from "~/features/hiring/hackathons/components/PublishDialog";
import { RolePicker } from "~/features/hiring/hackathons/components/RolePicker";
import { StarterTasksField } from "~/features/hiring/hackathons/components/StarterTasksField";
import { HackathonScheduleFields } from "~/features/hiring/hackathons/components/HackathonScheduleFields";
import {
	type HackathonFormValues,
	useHackathonForm,
} from "~/features/hiring/hackathons/hooks/useHackathonForm";

type HackathonFormProps = {
	readonly slug: string;
	readonly startupId: Id<"startups">;
	readonly hackathonId?: Id<"hackathons">;
	readonly initialValues: HackathonFormValues;
};

/** One form for a new hackathon and for editing an unpublished one. */
export function HackathonForm({
	slug,
	startupId,
	hackathonId,
	initialValues,
}: HackathonFormProps) {
	const {
		values,
		setField,
		error,
		isPending,
		onSubmit,
		savedId,
		isPublishOpen,
		setIsPublishOpen,
		onPublished,
	} = useHackathonForm({
		slug,
		startupId,
		hackathonId,
		initialValues,
	});
	const hasDetails = Boolean(
		initialValues.evaluationCriteria || initialValues.compensation,
	);

	return (
		<>
			<form
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					void onSubmit("publish");
				}}
			>
				<FieldGroup>
					<RolePicker
						startupId={startupId}
						value={values.roleId}
						onChange={(roleId) => setField("roleId", roleId)}
						disabled={isPending}
					/>

					<FieldSeparator />

					<Field>
						<FieldLabel htmlFor="hackathon-title">Title</FieldLabel>
						<Input
							id="hackathon-title"
							value={values.title}
							disabled={isPending}
							onChange={(event) => setField("title", event.target.value)}
							placeholder="Build our onboarding flow"
							className="h-11"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="hackathon-description">Description</FieldLabel>
						<Textarea
							id="hackathon-description"
							value={values.description}
							disabled={isPending}
							onChange={(event) => setField("description", event.target.value)}
							placeholder="What Participants build, and what good looks like"
							rows={5}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="hackathon-max">Max participants</FieldLabel>
						<Input
							id="hackathon-max"
							type="number"
							inputMode="numeric"
							min={1}
							max={MAX_HACKATHON_PARTICIPANTS}
							value={values.maxParticipants}
							disabled={isPending}
							onChange={(event) =>
								setField("maxParticipants", event.target.value)
							}
							className="h-11 sm:max-w-32"
						/>
						<FieldDescription>
							Up to {MAX_HACKATHON_PARTICIPANTS}.
						</FieldDescription>
					</Field>

					<HackathonScheduleFields
						value={values.schedule}
						onChange={(schedule) => setField("schedule", schedule)}
						disabled={isPending}
					/>

					<Field>
						<FieldLabel htmlFor="hackathon-prize">Prize (optional)</FieldLabel>
						<Input
							id="hackathon-prize"
							value={values.prize}
							disabled={isPending}
							onChange={(event) => setField("prize", event.target.value)}
							placeholder="₹5,000 to the winner"
							className="h-11"
						/>
						<FieldDescription>Paid by you, outside Engin.</FieldDescription>
					</Field>

					<FieldSeparator />

					<StarterTasksField
						value={values.starterTasks}
						onChange={(starterTasks) => setField("starterTasks", starterTasks)}
						disabled={isPending}
					/>

					<Field>
						<FieldLabel htmlFor="hackathon-outcome">
							Expected outcome
						</FieldLabel>
						<Input
							id="hackathon-outcome"
							value={values.expectedOutcome}
							disabled={isPending}
							maxLength={GOAL_MAX}
							onChange={(event) =>
								setField("expectedOutcome", event.target.value)
							}
							placeholder="A working payments API"
							className="h-11"
						/>
						<FieldDescription>
							Needed to publish. One line: what Participants should have built
							by the end.
						</FieldDescription>
					</Field>

					<Collapsible defaultOpen={hasDetails} className="flex flex-col gap-4">
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								className="group self-start px-0 hover:bg-transparent"
							>
								More details
								<ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<FieldGroup className="gap-4">
								<Field>
									<FieldLabel htmlFor="hackathon-criteria">
										Evaluation criteria
									</FieldLabel>
									<Textarea
										id="hackathon-criteria"
										value={values.evaluationCriteria}
										disabled={isPending}
										onChange={(event) =>
											setField("evaluationCriteria", event.target.value)
										}
										rows={3}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="hackathon-compensation">
										Compensation
									</FieldLabel>
									<Textarea
										id="hackathon-compensation"
										value={values.compensation}
										disabled={isPending}
										onChange={(event) =>
											setField("compensation", event.target.value)
										}
										placeholder="What the hire is paid"
										rows={2}
									/>
								</Field>
							</FieldGroup>
						</CollapsibleContent>
					</Collapsible>

					{error ? <FieldError>{error}</FieldError> : null}

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button asChild variant="ghost" className="h-11">
							<Link to="/s/$slug/hiring" params={{ slug }}>
								Back
							</Link>
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={isPending}
							onClick={() => void onSubmit("save")}
							className="h-11"
						>
							Save for later
						</Button>
						<Button type="submit" disabled={isPending} className="h-11">
							{isPending ? <Spinner /> : null}
							Continue to publish
						</Button>
					</div>
				</FieldGroup>
			</form>

			{savedId && isPublishOpen ? (
				<PublishDialog
					open
					onOpenChange={setIsPublishOpen}
					slug={slug}
					hackathonId={savedId}
					title={values.title.trim()}
					schedule={values.schedule}
					onPublished={onPublished}
				/>
			) : null}
		</>
	);
}
