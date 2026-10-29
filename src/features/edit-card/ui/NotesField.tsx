import { CARD_TEXT } from "@convex/cards/rules";
import { type RefObject, useEffect, useRef, useState } from "react";
import type { CardView } from "~/entities/card";
import { relativeTime } from "~/shared/lib/dates";
import { MentorNote } from "~/shared/ui/MentorNote";
import { PersonName } from "~/shared/ui/PersonName";
import { Textarea } from "~/shared/ui/textarea";
import { useDraft } from "../lib/useDraft";

const IDLE_MS = 1000;

/** A Card's notes. Saves on blur and after a second of quiet. */
export function NotesField({
	card,
	onSave,
	isReadOnly = false,
	isDiscarded,
	inputRef,
}: {
	readonly card: CardView;
	/** Shows the notes as text: nothing can change them any more. */
	readonly isReadOnly?: boolean;
	/** True while the Card is being deleted: nothing more is saved. */
	readonly isDiscarded: RefObject<boolean>;
	/** The field itself, so the panel can move focus to it. */
	readonly inputRef?: RefObject<HTMLTextAreaElement | null>;
	readonly onSave: (notes: string) => Promise<boolean>;
}) {
	const { draft, setDraft, setIsFocused, expect, settle } = useDraft(
		card.notes,
	);
	const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
		"idle",
	);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const latest = useRef({ draft, saved: card.notes, onSave });
	latest.current = { draft, saved: card.notes, onSave };

	async function save() {
		clearTimeout(timer.current);
		if (isDiscarded.current) return;
		const { draft: text, saved, onSave: send } = latest.current;
		const next = text.trim();
		if (next === saved) return;

		expect(next);
		setSaveState("saving");
		const isSaved = await send(next);
		settle();
		setSaveState(isSaved ? "saved" : "idle");
	}

	// Leaving the Card with a change still waiting: save it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: save reads only refs
	useEffect(() => () => void save(), []);

	const edited =
		card.notesEditedAt !== null && card.notesEditedBy ? (
			<MentorNote>
				edited {relativeTime(card.notesEditedAt, Date.now())} by{" "}
				<PersonName person={card.notesEditedBy} />
			</MentorNote>
		) : null;

	if (isReadOnly) {
		return (
			<div className="flex flex-col gap-1.5">
				<p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
					{card.notes || "No notes"}
				</p>
				{edited}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<Textarea
				ref={inputRef}
				aria-label="Notes"
				placeholder="Add notes"
				value={draft}
				maxLength={CARD_TEXT.notes}
				className="min-h-24"
				onChange={(e) => {
					setDraft(e.target.value);
					setSaveState("idle");
					clearTimeout(timer.current);
					timer.current = setTimeout(() => void save(), IDLE_MS);
				}}
				onFocus={() => setIsFocused(true)}
				onBlur={() => {
					setIsFocused(false);
					void save();
				}}
			/>
			<div role="status">
				{saveState === "idle" ? null : (
					<MentorNote>
						{saveState === "saving" ? "Saving…" : "Saved"}
					</MentorNote>
				)}
			</div>
			{edited}
		</div>
	);
}
