import { TEXT } from "@convex/shared/limits";
import { PlusIcon } from "lucide-react";
import { type Ref, useState } from "react";
import { Kbd } from "~/components/Kbd";
import { MentorNote } from "~/components/MentorNote";
import { Textarea } from "~/components/ui/textarea";
import { isSendKey } from "~/lib/keys";

/** Adds a Card to To do: Enter creates and stays focused, Esc leaves. */
export function NewCardInput({
	onCreate,
	note,
	inputRef,
	placeholder = "What will you finish this week?",
	shortcut = "C",
}: {
	readonly onCreate: (title: string) => Promise<boolean>;
	/** One line of guidance under the input. */
	readonly note?: string;
	readonly inputRef?: Ref<HTMLTextAreaElement>;
	readonly placeholder?: string;
	/** The key that focuses it, hinted while it's empty; `null` where there is none. */
	readonly shortcut?: string | null;
}) {
	const [title, setTitle] = useState("");

	return (
		<div className="flex shrink-0 flex-col gap-1.5">
			<div className="relative">
				<PlusIcon
					aria-hidden
					className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-subtle-foreground"
				/>
				{/* A textarea, so the placeholder wraps in a narrow column. Titles stay one line. */}
				<Textarea
					ref={inputRef}
					rows={1}
					aria-label="New Card"
					placeholder={placeholder}
					value={title}
					maxLength={TEXT.cardTitle}
					autoComplete="off"
					className="peer min-h-9 resize-none border-transparent bg-transparent py-2 pr-8 pl-8 hover:border-transparent hover:bg-accent/40 focus-visible:border-input focus-visible:bg-card"
					onChange={(event) =>
						setTitle(event.target.value.replace(/\s*\n\s*/g, " "))
					}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							event.currentTarget.blur();
						} else if (event.key === "Enter" && event.shiftKey) {
							event.preventDefault();
						} else if (isSendKey(event.nativeEvent)) {
							event.preventDefault();
							const next = title.trim();
							if (!next) return;
							setTitle("");
							void onCreate(next).then((isCreated) => {
								// Keep what was typed, unless more has been typed since.
								if (!isCreated) setTitle((current) => current || next);
							});
						}
					}}
				/>
				{shortcut ? (
					<Kbd className="absolute top-2 right-2 peer-focus:invisible peer-[:not(:placeholder-shown)]:invisible">
						{shortcut}
					</Kbd>
				) : null}
			</div>
			{note ? (
				<div className="px-2.5">
					<MentorNote>{note}</MentorNote>
				</div>
			) : null}
		</div>
	);
}
