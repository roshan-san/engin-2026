import { TEXT } from "@convex/shared/limits";
import { useRef } from "react";
import type { CardView } from "~/entities/card";
import { Textarea } from "~/shared/ui/textarea";
import { useDraft } from "../lib/useDraft";

/** The title, edited in place; saves on blur or Enter, Esc undoes. Wraps, but stays one line. */
export function TitleField({
	card,
	isLocked,
	onSave,
}: {
	readonly card: CardView;
	readonly isLocked: boolean;
	readonly onSave: (
		cardId: CardView["_id"],
		patch: { title: string },
	) => Promise<boolean>;
}) {
	const { draft, setDraft, setIsFocused, expect, settle } = useDraft(
		card.title,
	);
	const isUndoing = useRef(false);

	if (isLocked) {
		return <h2 className="text-lg font-semibold break-words">{card.title}</h2>;
	}

	async function save() {
		if (isUndoing.current) {
			isUndoing.current = false;
			return;
		}
		const next = draft.trim();
		if (next === card.title) return;
		if (!next) {
			setDraft(card.title);
			return;
		}
		expect(next);
		const isSaved = await onSave(card._id, { title: next });
		settle();
		if (!isSaved) setDraft(card.title);
	}

	return (
		<Textarea
			aria-label="Title"
			rows={1}
			value={draft}
			maxLength={TEXT.cardTitle}
			className="-mx-2 min-h-0 w-[calc(100%+1rem)] resize-none border-transparent bg-transparent px-2 py-1 text-lg font-semibold hover:border-transparent hover:bg-accent/40 focus-visible:bg-background md:text-lg"
			onChange={(e) => setDraft(e.target.value.replace(/\s*\n\s*/g, " "))}
			onFocus={() => setIsFocused(true)}
			onBlur={() => {
				setIsFocused(false);
				void save();
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" && !e.nativeEvent.isComposing) {
					e.preventDefault();
					e.currentTarget.blur();
				} else if (e.key === "Escape") {
					isUndoing.current = true;
					setDraft(card.title);
					e.currentTarget.blur();
				}
			}}
		/>
	);
}
