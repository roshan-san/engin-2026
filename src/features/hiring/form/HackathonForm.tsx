import { TEXT } from "@convex/lib/limits";
import { type FormEvent, type ReactNode, useState } from "react";
import { ChipPicker } from "~/components/shared/ChipPicker";
import { FormFooter } from "~/components/shared/FormFooter";
import { MentorNote } from "~/components/shared/MentorNote";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { MODES, PAYS, ROLES } from "../jobChips";
import { CardRows } from "./CardRows";
import { BUILDERS_GET, type HackathonDraft, isDraftReady } from "./draft";
import { startOptions } from "./startOptions";

const WEEKS = [
	{ value: "1", label: "1 week" },
	{ value: "2", label: "2 weeks" },
] as const;

const BUILDERS_GET_CHIPS = [...BUILDERS_GET, "Custom"].map((value) => ({
	value,
	label: value,
}));

/** One labelled part of the form, with its mentor note beside it on wide screens. */
function Part({
	label,
	note,
	children,
}: {
	readonly label: string;
	readonly note?: string;
	readonly children: ReactNode;
}) {
	return (
		<section className="grid gap-x-8 gap-y-2 lg:grid-cols-[minmax(0,1fr)_14rem]">
			<div className="flex min-w-0 flex-col gap-2.5">
				<h2 className="text-sm font-medium">{label}</h2>
				{children}
			</div>
			{note ? (
				<div className="lg:pt-7">
					<MentorNote>{note}</MentorNote>
				</div>
			) : null}
		</section>
	);
}

/** The Hackathon post: mostly chips, with a mentor note on each part. */
export function HackathonForm({
	initial,
	submitLabel,
	onSubmit,
	secondary,
}: {
	readonly initial: HackathonDraft;
	readonly submitLabel: string;
	/** Resolves `false` when it didn't save (the error is shown already). */
	readonly onSubmit: (draft: HackathonDraft) => Promise<boolean>;
	/** A second way to submit, beside the first: Publish saves, then publishes. */
	readonly secondary?: {
		readonly label: string;
		readonly onSubmit: (draft: HackathonDraft) => Promise<boolean>;
	};
}) {
	const [draft, setDraft] = useState(initial);
	const [isSaving, setIsSaving] = useState(false);
	const [options] = useState(() => startOptions(Date.now()));
	// A saved start that has passed isn't offered; the Founder picks a new one.
	const startValue =
		draft.startsAt !== null &&
		options.some((option) => option.startsAt === draft.startsAt)
			? String(draft.startsAt)
			: null;
	const isReady = isDraftReady(draft) && startValue !== null;

	function set<K extends keyof HackathonDraft>(
		key: K,
		value: HackathonDraft[K],
	) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	async function run(action: (draft: HackathonDraft) => Promise<boolean>) {
		if (!isReady) return;
		setIsSaving(true);
		await action(draft);
		setIsSaving(false);
	}

	function submit(event: FormEvent) {
		event.preventDefault();
		void run(onSubmit);
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-10">
			<Part label="The job">
				<ChipPicker
					label="Role"
					options={ROLES}
					value={draft.job.role}
					onChange={(role) => set("job", { ...draft.job, role })}
				/>
				<ChipPicker
					label="Pay"
					options={PAYS}
					value={draft.job.pay}
					onChange={(pay) => set("job", { ...draft.job, pay })}
				/>
				<ChipPicker
					label="Where"
					options={MODES}
					value={draft.job.mode}
					onChange={(mode) => set("job", { ...draft.job, mode })}
				/>
			</Part>

			<Part
				label="The problem"
				note="A real first-month problem. Finishable in a week."
			>
				<Textarea
					aria-label="The problem"
					value={draft.problem}
					maxLength={TEXT.problem}
					className="min-h-28"
					onChange={(e) => set("problem", e.target.value)}
				/>
			</Part>

			<Part label="Cards" note="3–5 cards. Each done in a day.">
				<CardRows
					cards={draft.cards}
					onChange={(cards) => set("cards", cards)}
				/>
			</Part>

			<Part label="Length and start" note="One week fits most roles.">
				<ChipPicker
					label="Length"
					options={WEEKS}
					value={draft.weeks === 1 ? "1" : "2"}
					onChange={(weeks) => set("weeks", weeks === "1" ? 1 : 2)}
				/>
				<ChipPicker
					label="Start"
					options={options.map((option) => ({
						value: String(option.startsAt),
						label: option.label,
					}))}
					value={startValue}
					onChange={(startsAt) => set("startsAt", Number(startsAt))}
				/>
				{draft.startsAt !== null && startValue === null ? (
					<MentorNote>Pick a new start.</MentorNote>
				) : null}
			</Part>

			<Part
				label="What Builders get"
				note="Even ₹1,000 brings better builders."
			>
				<ChipPicker
					label="What Builders get"
					options={BUILDERS_GET_CHIPS}
					value={draft.buildersGet.choice}
					onChange={(choice) =>
						set("buildersGet", { ...draft.buildersGet, choice })
					}
				/>
				{draft.buildersGet.choice === "Custom" ? (
					<Input
						aria-label="What Builders get"
						placeholder="One line"
						value={draft.buildersGet.custom}
						maxLength={TEXT.buildersGet}
						onChange={(e) =>
							set("buildersGet", {
								...draft.buildersGet,
								custom: e.target.value,
							})
						}
					/>
				) : null}
			</Part>

			<FormFooter>
				<Button
					type="submit"
					variant={secondary ? "outline" : "default"}
					disabled={!isReady || isSaving}
				>
					{isSaving && !secondary ? <Spinner /> : null}
					{submitLabel}
				</Button>
				{secondary ? (
					<Button
						type="button"
						disabled={!isReady || isSaving}
						onClick={() => void run(secondary.onSubmit)}
					>
						{isSaving ? <Spinner /> : null}
						{secondary.label}
					</Button>
				) : null}
			</FormFooter>
		</form>
	);
}
