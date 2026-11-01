import type { Id } from "@convex/_generated/dataModel";
import { CYCLE_TEXT } from "@convex/cycles/rules";
import { useState } from "react";
import type { CycleReview } from "~/entities/cycle";
import { GOAL_QUESTION } from "~/shared/config/goalQuestion";
import { Button } from "~/shared/ui/button";
import { Input } from "~/shared/ui/input";
import { Section } from "~/shared/ui/Section";
import { Segmented } from "~/shared/ui/Segmented";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/shared/ui/sheet";
import { Spinner } from "~/shared/ui/spinner";
import { useCloseReview } from "../api/useCloseReview";
import {
	canCloseReview,
	type ReviewDraft,
	toCloseArgs,
} from "../model/reviewDraft";

const ANSWERS = [
	{ value: "yes", label: "Yes" },
	{ value: "no", label: "No" },
] as const;

const FATES = [
	{ value: "carry", label: "Carry" },
	{ value: "drop", label: "Drop" },
] as const;

/** Closes last week. It sits over the page and closes freely: the review never blocks. */
export function ReviewSheet({
	startupId,
	review,
	open,
	onOpenChange,
}: {
	readonly startupId: Id<"startups">;
	readonly review: CycleReview;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}) {
	const close = useCloseReview(startupId);
	const [isClosing, setIsClosing] = useState(false);
	const [draft, setDraft] = useState<ReviewDraft>({
		goalMet: null,
		dropped: new Set(),
		nextGoal: null,
	});
	const hasGoal = review.goal !== null;

	function setFate(cardId: string, fate: "carry" | "drop") {
		setDraft((current) => {
			const dropped = new Set(current.dropped);
			if (fate === "drop") dropped.add(cardId);
			else dropped.delete(cardId);
			return { ...current, dropped };
		});
	}

	async function submit() {
		setIsClosing(true);
		const isClosed = await close(toCloseArgs(draft, review));
		setIsClosing(false);
		if (isClosed) onOpenChange(false);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Monday review</SheetTitle>
					<SheetDescription>Close Cycle {review.number}.</SheetDescription>
				</SheetHeader>
				<div className="flex flex-col gap-8 px-4">
					{hasGoal ? (
						<Section label="Did this happen?">
							<p className="text-sm break-words">{review.goal}</p>
							<Segmented
								label="Did this happen?"
								options={ANSWERS}
								value={
									draft.goalMet === null ? null : draft.goalMet ? "yes" : "no"
								}
								className="self-start"
								onChange={(answer) =>
									setDraft((current) => ({
										...current,
										goalMet: answer === "yes",
									}))
								}
							/>
						</Section>
					) : null}

					{review.unfinished.length > 0 ? (
						<Section label="Unfinished Cards">
							<ul className="flex flex-col gap-2">
								{review.unfinished.map((card) => (
									<li key={card._id} className="flex items-center gap-3">
										<p className="min-w-0 flex-1 text-sm break-words">
											{card.title}
										</p>
										<Segmented
											label={card.title}
											options={FATES}
											value={draft.dropped.has(card._id) ? "drop" : "carry"}
											onChange={(fate) => setFate(card._id, fate)}
										/>
									</li>
								))}
							</ul>
						</Section>
					) : null}

					<div className="flex flex-col gap-2">
						<label htmlFor="review-next-goal" className="text-sm font-medium">
							{GOAL_QUESTION}
						</label>
						<Input
							id="review-next-goal"
							value={draft.nextGoal ?? review.currentGoal ?? ""}
							maxLength={CYCLE_TEXT.goal}
							autoComplete="off"
							onChange={(event) => {
								const nextGoal = event.target.value;
								setDraft((current) => ({ ...current, nextGoal }));
							}}
						/>
					</div>
				</div>
				<SheetFooter>
					<Button
						disabled={isClosing || !canCloseReview(draft, hasGoal)}
						onClick={() => void submit()}
					>
						{isClosing ? <Spinner /> : null}
						Close Cycle {review.number}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
