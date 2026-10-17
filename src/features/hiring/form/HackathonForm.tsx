import { TEXT } from "@convex/shared/limits";
import { useBlocker } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { CharCount } from "~/components/CharCount";
import { ChipPicker } from "~/components/ChipPicker";
import { MentorNote } from "~/components/MentorNote";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { monthDayLabel } from "../hackathonDates";
import { MODES, PAYS, ROLES } from "../jobChips";
import { HackathonPost } from "../public/HackathonPost";
import { CardRows } from "./CardRows";
import {
	type HackathonDraft,
	missingParts,
	PARTICIPANTS_GET,
	toParticipantsGet,
} from "./draft";
import { shouldBlockLeave } from "./leaveGuard";
import { startOptions } from "./startOptions";

const WEEKS = [
	{ value: "1", label: "1 week" },
	{ value: "2", label: "2 weeks" },
] as const;

const PARTICIPANTS_GET_CHIPS = [...PARTICIPANTS_GET, "Custom"].map((value) => ({
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
				<h2 className="text-lg font-semibold">{label}</h2>
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
	const leaveGuard = () =>
		shouldBlockLeave(
			latest.current.draft,
			initial,
			latest.current.pending,
			savedRef.current,
		);
	const blocker = useBlocker({
		shouldBlockFn: leaveGuard,
		enableBeforeUnload: leaveGuard,
		withResolver: true,
	});
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
					<div className="flex flex-col gap-1.5">
						<Textarea
							aria-label="The problem"
							placeholder="What's broken, and what good looks like"
							value={draft.problem}
							maxLength={TEXT.problem}
							className="min-h-32"
							onChange={(e) => set("problem", e.target.value)}
						/>
						<CharCount value={draft.problem} max={TEXT.problem} />
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

				<Part
					label="What Participants get"
					note="Even ₹1,000 brings better Participants."
				>
					<ChipPicker
						label="What Participants get"
						options={PARTICIPANTS_GET_CHIPS}
						value={draft.participantsGet.choice}
						onChange={(choice) =>
							set("participantsGet", { ...draft.participantsGet, choice })
						}
					/>
					{draft.participantsGet.choice === "Custom" ? (
						<div className="flex flex-col gap-1.5">
							<Input
								aria-label="What Participants get"
								placeholder="One line"
								value={draft.participantsGet.custom}
								maxLength={TEXT.participantsGet}
								onChange={(e) =>
									set("participantsGet", {
										...draft.participantsGet,
										custom: e.target.value,
									})
								}
							/>
							<CharCount
								value={draft.participantsGet.custom}
								max={TEXT.participantsGet}
							/>
						</div>
					) : null}
				</Part>

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

			<AlertDialog
				open={blocker.status === "blocked"}
				onOpenChange={(open) => {
					if (!open) blocker.reset?.();
				}}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Leave without saving?</AlertDialogTitle>
						<AlertDialogDescription>
							What you wrote here will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Stay</AlertDialogCancel>
						<AlertDialogAction onClick={() => blocker.proceed?.()}>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={isConfirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmation?.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (secondary) void run("publish", secondary.onSubmit);
							}}
						>
							{secondary?.label}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

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
							participantsGet:
								toParticipantsGet(
									draft.participantsGet.choice,
									draft.participantsGet.custom,
								) ?? null,
						}}
					/>
				</div>
			</aside>
		</div>
	);
}
