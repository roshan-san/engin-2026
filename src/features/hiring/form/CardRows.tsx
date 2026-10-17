import { MAX_HACKATHON_CARDS, TEXT } from "@convex/shared/limits";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { CharCount } from "~/components/CharCount";
import { MentorNote } from "~/components/MentorNote";
import { TILE_CLASS } from "~/features/work/board/CardTile";
import { ColumnIcon } from "~/features/work/board/ColumnIcon";
import { NewCardInput } from "~/features/work/board/NewCardInput";
import { cn } from "~/lib/utils";
import { draftCard, type HackathonDraft } from "./draft";

type DraftCard = HackathonDraft["cards"][number];

/** A field drawn as plain text on the tile, the way the Board shows it. */
const BARE_FIELD_CLASS =
	"field-sizing-content w-full min-w-0 resize-none bg-transparent outline-none placeholder:text-subtle-foreground";

/**
 * The 3–5 Cards every Participant starts with, drawn as the To do column they land in: the Board's
 * new-Card input on top, then a tile per Card, edited in place.
 */
export function CardRows({
	cards,
	onChange,
}: {
	readonly cards: DraftCard[];
	readonly onChange: (cards: DraftCard[]) => void;
}) {
	function patch(key: string, next: Partial<DraftCard>) {
		onChange(
			cards.map((card) => (card.key === key ? { ...card, ...next } : card)),
		);
	}

	return (
		<section
			aria-label="To do"
			className="flex w-full max-w-sm flex-col rounded-lg bg-muted/25"
		>
			<h3 className="flex h-10 shrink-0 items-center gap-2 px-3 text-sm font-medium">
				<ColumnIcon column="todo" />
				To do
				<span className="text-xs font-normal text-subtle-foreground tabular-nums">
					{cards.length}
				</span>
			</h3>
			<div className="flex flex-col gap-1.5 px-1.5 pt-0.5 pb-1.5">
				{cards.length < MAX_HACKATHON_CARDS ? (
					<NewCardInput
						placeholder="What will a Participant finish in a day?"
						shortcut={null}
						onCreate={async (title) => {
							onChange([...cards, draftCard(title)]);
							return true;
						}}
					/>
				) : (
					<div className="px-2.5 py-2">
						<MentorNote>{MAX_HACKATHON_CARDS} is the most.</MentorNote>
					</div>
				)}
				<ol className="flex flex-col gap-1.5">
					{cards.map((card, index) => (
						<DraftCardTile
							key={card.key}
							number={index + 1}
							card={card}
							onChange={(next) => patch(card.key, next)}
							onRemove={() => onChange(cards.filter((c) => c.key !== card.key))}
						/>
					))}
				</ol>
			</div>
		</section>
	);
}

/** One Card as a Board tile: its title, then its notes once there are any. */
function DraftCardTile({
	number,
	card,
	onChange,
	onRemove,
}: {
	readonly number: number;
	readonly card: DraftCard;
	readonly onChange: (next: Partial<DraftCard>) => void;
	readonly onRemove: () => void;
}) {
	const [hasNotes, setHasNotes] = useState(card.notes.length > 0);
	const isUntitled = !card.title.trim();

	return (
		<li
			className={cn(
				TILE_CLASS,
				"group flex flex-col gap-1.5 transition-colors hover:border-input focus-within:border-input",
				isUntitled && "border-dashed",
			)}
		>
			<div className="flex items-start gap-2">
				{/* Titles stay one line, as on the Board; the textarea only wraps them. */}
				<textarea
					rows={1}
					aria-label={`Card ${number} title`}
					placeholder="Card title"
					value={card.title}
					maxLength={TEXT.cardTitle}
					className={cn(BARE_FIELD_CLASS, "text-sm break-words")}
					onChange={(e) =>
						onChange({ title: e.target.value.replace(/\s*\n\s*/g, " ") })
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.preventDefault();
					}}
				/>
				<button
					type="button"
					aria-label={`Remove card ${number}`}
					className="-my-1.5 -mr-2 flex size-8 shrink-0 items-center justify-center rounded text-subtle-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 pointer-coarse:opacity-100 focus-ring"
					onClick={onRemove}
				>
					<XIcon className="size-3.5" />
				</button>
			</div>
			{hasNotes ? (
				<>
					<textarea
						rows={1}
						// Opened by "Add notes", so the cursor goes where the click was.
						// biome-ignore lint/a11y/noAutofocus: see above
						autoFocus={card.notes.length === 0}
						aria-label={`Card ${number} notes`}
						placeholder="Notes for the Participant"
						value={card.notes}
						maxLength={TEXT.notes}
						className={cn(BARE_FIELD_CLASS, "text-xs text-muted-foreground")}
						onChange={(e) => onChange({ notes: e.target.value })}
						onBlur={() => {
							if (!card.notes.trim()) setHasNotes(false);
						}}
					/>
					<CharCount value={card.notes} max={TEXT.notes} />
				</>
			) : (
				<button
					type="button"
					className="self-start text-xs text-subtle-foreground hover:text-foreground focus-ring"
					onClick={() => setHasNotes(true)}
				>
					Add notes
				</button>
			)}
		</li>
	);
}
