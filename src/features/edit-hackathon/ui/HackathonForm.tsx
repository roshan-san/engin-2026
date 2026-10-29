import { STARTUP_TEXT } from "@convex/startups/rules";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { monthDayLabel } from "~/shared/lib/dates";
import { Button } from "~/shared/ui/button";
import { CharCount } from "~/shared/ui/CharCount";
import { ChipPicker } from "~/shared/ui/ChipPicker";
import { MentorNote } from "~/shared/ui/MentorNote";
import { Spinner } from "~/shared/ui/spinner";
import { Textarea } from "~/shared/ui/textarea";
import { type HackathonDraft, missingParts } from "../model/draft";
import { shouldBlockLeave } from "../model/leaveGuard";
import { startOptions } from "../model/startOptions";
import { CardRows } from "./CardRows";
import { Field, Part } from "./FormPart";
import { FormPreview } from "./FormPreview";
import { JobPart } from "./JobPart";
import { LeaveGuardDialog } from "./LeaveGuardDialog";
import { ParticipantsGetPart } from "./ParticipantsGetPart";
import { PublishConfirmDialog } from "./PublishConfirmDialog";

const WEEKS = [
	{ value: "1", label: "1 week" },
	{ value: "2", label: "2 weeks" },
] as const;

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
		/** Shown but not pressable, e.g. while the plan can't publish. */
		readonly disabled?: boolean;
		/** When it returns text, the button asks first and runs `onSubmit` only once that's accepted. */
		readonly confirm?: (
			draft: HackathonDraft,
		) => { title: string; description: string } | null;
		readonly onSubmit: (draft: HackathonDraft) => Promise<boolean>;
	};
}) {
	const [draft, setDraft] = useState(initial);
	// Which button is working: only that one spins.
	const [pending, setPending] = useState<"save" | "publish" | null>(null);
	// The question Publish asks first, while it's open.
	const [isConfirming, setConfirming] = useState(false);
	// True from a successful save until the next edit. A ref, so the blocker sees it the moment
	// the save returns, before the page navigates away.
	const savedRef = useRef(false);
	const latest = useRef({ draft, pending });
	latest.current = { draft, pending };
	// Stable, so the blocker registers once rather than on every keystroke.
	const leaveGuard = useCallback(
		() =>
			shouldBlockLeave(
				latest.current.draft,
				initial,
				latest.current.pending,
				savedRef.current,
			),
		[initial],
	);
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
		savedRef.current = false;
		setDraft((current) => ({ ...current, [key]: value }));
	}

	async function run(
		kind: "save" | "publish",
		action: (draft: HackathonDraft) => Promise<boolean>,
	) {
		if (!isReady) return;
		setPending(kind);
		const isSaved = await action(draft);
		if (isSaved) savedRef.current = true;
		setPending(null);
	}

	const confirmation = secondary?.confirm?.(draft) ?? null;

	function submit(event: FormEvent) {
		event.preventDefault();
		void run("save", onSubmit);
	}

	return (
		<div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:gap-16">
			<form onSubmit={submit} className="flex min-w-0 flex-col gap-10">
				<JobPart job={draft.job} onChange={(job) => set("job", job)} />

				<Part
					label="The problem"
					note="A real first-month problem. Finishable in a week."
				>
					<div className="flex flex-col gap-1.5">
						<Textarea
							aria-label="The problem"
							placeholder="What's broken, and what good looks like"
							value={draft.problem}
							maxLength={STARTUP_TEXT.problem}
							className="min-h-32"
							onChange={(e) => set("problem", e.target.value)}
						/>
						<CharCount value={draft.problem} max={STARTUP_TEXT.problem} />
					</div>
				</Part>

				<Part
					label="Cards"
					note="3–5 Cards, each done in a day. Every Participant starts with them in To do."
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

				<ParticipantsGetPart
					value={draft.participantsGet}
					onChange={(value) => set("participantsGet", value)}
				/>

				<div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t bg-background px-4 py-3 md:static md:mx-0 md:justify-end md:border-t-0 md:px-0 md:py-0">
					{isReady ? null : (
						<p className="mr-auto min-w-0 text-xs text-muted-foreground">
							Still to do: {missing.join(", ")}
						</p>
					)}
					<Button
						type="submit"
						variant={secondary ? "outline" : "default"}
						disabled={!isReady || pending !== null}
					>
						{pending === "save" ? <Spinner /> : null}
						{submitLabel}
					</Button>
					{secondary ? (
						<Button
							type="button"
							disabled={!isReady || pending !== null || secondary.disabled}
							onClick={() =>
								confirmation
									? setConfirming(true)
									: void run("publish", secondary.onSubmit)
							}
						>
							{pending === "publish" ? <Spinner /> : null}
							{secondary.label}
						</Button>
					) : null}
				</div>
			</form>

			<LeaveGuardDialog shouldBlock={leaveGuard} />

			<PublishConfirmDialog
				open={isConfirming}
				onOpenChange={setConfirming}
				confirmation={confirmation}
				actionLabel={secondary?.label}
				onConfirm={() => {
					if (secondary) void run("publish", secondary.onSubmit);
				}}
			/>

			<FormPreview
				startupName={startupName}
				draft={draft}
				startsAt={startValue === null ? null : draft.startsAt}
			/>
		</div>
	);
}
