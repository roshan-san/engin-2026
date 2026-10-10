import { TEXT } from "@convex/lib/limits";
import { type Ref, useState } from "react";
import { MentorNote } from "~/components/shared/MentorNote";
import { Input } from "~/components/ui/input";
import { isSendKey } from "./keys";

/** Adds a Card to To do: Enter creates and stays focused, Esc leaves. */
export function NewCardInput({
	onCreate,
	hasOpenCards,
	inputRef,
}: {
	readonly onCreate: (title: string) => Promise<void>;
	readonly hasOpenCards: boolean;
	readonly inputRef: Ref<HTMLInputElement>;
}) {
	const [title, setTitle] = useState("");

	return (
		<div className="flex flex-col gap-1.5">
			<Input
				ref={inputRef}
				aria-label="New Card"
				placeholder="What will you finish this week?"
				value={title}
				maxLength={TEXT.cardTitle}
				autoComplete="off"
				onChange={(event) => setTitle(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Escape") {
						event.currentTarget.blur();
					} else if (isSendKey(event.nativeEvent)) {
						event.preventDefault();
						const next = title.trim();
						if (!next) return;
						setTitle("");
						void onCreate(next);
					}
				}}
			/>
			{hasOpenCards ? null : <MentorNote>3 is a good week.</MentorNote>}
		</div>
	);
}
