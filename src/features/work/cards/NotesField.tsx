import { TEXT } from "@convex/lib/limits";
import { type RefObject, useEffect, useRef } from "react";
import { MentorNote } from "~/components/shared/MentorNote";
import { Textarea } from "~/components/ui/textarea";
import type { CardView } from "../board/types";
import { displayName } from "./displayName";
import { useDraft } from "./hooks/useDraft";
import { relativeTime } from "./relativeTime";

const IDLE_MS = 1000;

/** A Card's notes. Saves on blur and after a second of quiet. */
export function NotesField({
	card,
	onSave,
	isDiscarded,
}: {
	readonly card: CardView;
	/** True while the Card is being deleted: nothing more is saved. */
	readonly isDiscarded: RefObject<boolean>;
	readonly onSave: (notes: string) => Promise<boolean>;
}) {
	const { draft, setDraft, setIsFocused, expect, settle } = useDraft(
		card.notes,
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
		await send(next);
		settle();
	}

	// Leaving the Card with a change still waiting: save it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: save reads only refs
	useEffect(() => () => void save(), []);

	return (
		<div className="flex flex-col gap-1.5">
			<Textarea
				aria-label="Notes"
				placeholder="Add notes"
				value={draft}
				maxLength={TEXT.notes}
				className="min-h-24"
				onChange={(e) => {
					setDraft(e.target.value);
					clearTimeout(timer.current);
					timer.current = setTimeout(() => void save(), IDLE_MS);
				}}
				onFocus={() => setIsFocused(true)}
				onBlur={() => {
					setIsFocused(false);
					void save();
				}}
			/>
			{card.notesEditedAt !== null && card.notesEditedBy ? (
				<MentorNote>
					edited {relativeTime(card.notesEditedAt, Date.now())} by{" "}
					{displayName(card.notesEditedBy)}
				</MentorNote>
			) : null}
		</div>
	);
}
