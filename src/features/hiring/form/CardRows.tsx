import {
	MAX_HACKATHON_CARDS,
	MIN_HACKATHON_CARDS,
	TEXT,
} from "@convex/lib/limits";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { draftCard, type HackathonDraft } from "./draft";

type DraftCard = HackathonDraft["cards"][number];

/** The 3–5 Cards every Builder starts with: a title each, notes if needed. */
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
		<div className="flex flex-col gap-2">
			<ol className="flex flex-col gap-2">
				{cards.map((card, index) => (
					<CardRow
						key={card.key}
						index={index}
						card={card}
						canRemove={cards.length > MIN_HACKATHON_CARDS}
						onChange={(next) => patch(card.key, next)}
						onRemove={() => onChange(cards.filter((c) => c.key !== card.key))}
					/>
				))}
			</ol>
			{cards.length < MAX_HACKATHON_CARDS ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="self-start"
					onClick={() => onChange([...cards, draftCard()])}
				>
					<PlusIcon />
					Add card
				</Button>
			) : null}
		</div>
	);
}

function CardRow({
	index,
	card,
	canRemove,
	onChange,
	onRemove,
}: {
	readonly index: number;
	readonly card: DraftCard;
	readonly canRemove: boolean;
	readonly onChange: (next: Partial<DraftCard>) => void;
	readonly onRemove: () => void;
}) {
	const [hasNotes, setHasNotes] = useState(card.notes.length > 0);
	const number = index + 1;

	return (
		<li className="flex flex-col gap-1.5 rounded-lg border border-border p-2">
			<div className="flex items-center gap-2">
				<span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
					{number}
				</span>
				<Input
					aria-label={`Card ${number} title`}
					placeholder="Card title"
					value={card.title}
					maxLength={TEXT.cardTitle}
					onChange={(e) => onChange({ title: e.target.value })}
				/>
				{canRemove ? (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={`Remove card ${number}`}
						onClick={onRemove}
					>
						<XIcon />
					</Button>
				) : null}
			</div>
			{hasNotes ? (
				<Textarea
					aria-label={`Card ${number} notes`}
					placeholder="Notes"
					value={card.notes}
					maxLength={TEXT.notes}
					className="ml-7 w-[calc(100%-1.75rem)]"
					onChange={(e) => onChange({ notes: e.target.value })}
				/>
			) : (
				<button
					type="button"
					className="ml-7 self-start text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
					onClick={() => setHasNotes(true)}
				>
					Add notes
				</button>
			)}
		</li>
	);
}
