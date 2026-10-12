import { TEXT } from "@convex/shared/limits";
import { type FormEvent, type ReactNode, useState } from "react";
import { ChipPicker } from "~/components/ChipPicker";
import { FormFooter } from "~/components/FormFooter";
import { MentorNote } from "~/components/MentorNote";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { monthDayLabel } from "../hackathonDates";
import { MODES, PAYS, ROLES } from "../jobChips";
import { HackathonPost } from "../public/HackathonPost";
import { CardRows } from "./CardRows";
import {
	BUILDERS_GET,
	type HackathonDraft,
	missingParts,
	toBuildersGet,
} from "./draft";
import { startOptions } from "./startOptions";

const WEEKS = [
	{ value: "1", label: "1 week" },
	{ value: "2", label: "2 weeks" },
] as const;

const BUILDERS_GET_CHIPS = [...BUILDERS_GET, "Custom"].map((value) => ({
	value,
	label: value,
}));

/** One numbered part of the form: its label, then its mentor note, then the fields. */
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
		<section className="flex min-w-0 flex-col gap-3">
			<div className="flex flex-col gap-0.5">
				<h2 className="text-base font-medium">{label}</h2>
				{note ? <MentorNote>{note}</MentorNote> : null}
			</div>
			{children}
		</section>
	);
}

/** A chip row with its own small label, inside a Part. */
function Field({
	label,
	children,
}: {
	readonly label: string;
	readonly children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs text-muted-foreground">{label}</span>
			{children}
		</div>
	);
}

/** The Hackathon post: mostly chips, a mentor note on each part, and a live preview beside it. */
export function HackathonForm({
	startupName,
	initial,
	submitLabel,
	onSubmit,
	secondary,
}: {
	/** Shown in the preview: "<name> is hiring". */
	readonly startupName: string;
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
	const missing = [
		...missingParts(draft),
		...(startValue === null && draft.startsAt !== null ? ["a new start"] : []),
	];
	const isReady = missing.length === 0;

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
		<div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:gap-16">
			<form onSubmit={submit} className="flex min-w-0 flex-col gap-10">
				<Part label="The job">
					<Field label="Role">
						<ChipPicker
							label="Role"
							options={ROLES}
							value={draft.job.role}
							onChange={(role) => set("job", { ...draft.job, role })}
						/>
					</Field>
					<Field label="Pay">
						<ChipPicker
							label="Pay"
							options={PAYS}
							value={draft.job.pay}
							onChange={(pay) => set("job", { ...draft.job, pay })}
						/>
					</Field>
					<Field label="Where">
						<ChipPicker
							label="Where"
							options={MODES}
							value={draft.job.mode}
							onChange={(mode) => set("job", { ...draft.job, mode })}
						/>
					</Field>
				</Part>

				<Part
					label="The problem"
					note="A real first-month problem. Finishable in a week."
				>
					<Textarea
						aria-label="The problem"
						placeholder="What's broken, and what good looks like"
						value={draft.problem}
						maxLength={TEXT.problem}
						className="min-h-32"
						onChange={(e) => set("problem", e.target.value)}
					/>
				</Part>

				<Part
					label="Cards"
					note="3–5 Cards, each done in a day. Every Builder starts with them in To do."
				>
					<CardRows
						cards={draft.cards}
						onChange={(cards) => set("cards", cards)}
					/>
				</Part>

				<Part label="Length and start" note="One week fits most roles.">
					<Field label="Length">
						<ChipPicker
							label="Length"
							options={WEEKS}
							value={draft.weeks === 1 ? "1" : "2"}
							onChange={(weeks) => set("weeks", weeks === "1" ? 1 : 2)}
						/>
					</Field>
					<Field label="Start">
						<ChipPicker
							label="Start"
							options={options.map((option) => ({
								value: String(option.startsAt),
								label: `${option.label} · ${monthDayLabel(option.startsAt)}`,
							}))}
							value={startValue}
							onChange={(startsAt) => set("startsAt", Number(startsAt))}
						/>
					</Field>
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
					{isReady ? null : (
						<p className="mr-auto min-w-0 text-xs text-muted-foreground">
							Still to do: {missing.join(", ")}
						</p>
					)}
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

			<aside
				aria-label="Preview"
				className="hidden lg:sticky lg:top-6 lg:block lg:self-start"
			>
				<p className="mb-3 text-xs text-muted-foreground">
					Preview · what Applicants see
				</p>
				<div className="max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-xl border border-border p-6">
					<HackathonPost
						size="preview"
						post={{
							startupName,
							job: draft.job,
							problem: draft.problem,
							cards: draft.cards.map((card) => card.title),
							weeks: draft.weeks,
							startsAt: startValue === null ? null : draft.startsAt,
							buildersGet:
								toBuildersGet(
									draft.buildersGet.choice,
									draft.buildersGet.custom,
								) ?? null,
						}}
					/>
				</div>
			</aside>
		</div>
	);
}
