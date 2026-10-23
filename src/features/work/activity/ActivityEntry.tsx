import {
	ChevronRight,
	Flag,
	Handshake,
	ImageIcon,
	Link2,
	type LucideIcon,
	UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { PersonAvatar } from "~/features/people";
import { weekdayLabel } from "~/lib/dates";
import { tierText } from "~/lib/tierText";
import { cn } from "~/lib/utils";
import { EntryProof } from "./EntryProof";
import { type EntryView, entrySummary } from "./record";

const ROW = "flex w-full items-center gap-3 px-2 py-2 text-left text-sm";
const INTERACTIVE = "rounded-md transition-colors hover:bg-accent focus-ring";

const MILESTONE_ICON: Record<
	Exclude<EntryView["kind"], "card_verified">,
	LucideIcon
> = {
	contributor_joined: UserPlus,
	hackathon_finished: Flag,
	participant_hired: Handshake,
};

/**
 * One Activity line. A verified Card shows its proof: in the side panel
 * when `onSelect` is given, otherwise opened in place.
 */
export function ActivityEntry({
	entry,
	isSelected = false,
	onSelect,
}: {
	readonly entry: EntryView;
	readonly isSelected?: boolean;
	readonly onSelect?: (entryId: string) => void;
}) {
	const { card } = entry;

	if (!card) {
		return (
			<li className={ROW}>
				<EntryLine entry={entry} />
			</li>
		);
	}

	const counts = <ProofCounts card={card} />;

	if (onSelect) {
		return (
			<li>
				<button
					type="button"
					aria-current={isSelected ? "true" : undefined}
					onClick={() => onSelect(entry.id)}
					className={cn(ROW, INTERACTIVE, isSelected && "bg-accent")}
				>
					<EntryLine entry={entry}>{counts}</EntryLine>
					<ChevronRight
						aria-hidden
						className="-ml-1 size-4 shrink-0 text-muted-foreground"
					/>
				</button>
			</li>
		);
	}

	return (
		<li>
			<Collapsible className="group/entry">
				<CollapsibleTrigger
					className={cn(
						ROW,
						INTERACTIVE,
						"group-data-[state=open]/entry:bg-accent/50",
					)}
				>
					<EntryLine entry={entry}>{counts}</EntryLine>
					<ChevronRight
						aria-hidden
						className="-ml-1 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/entry:rotate-90"
					/>
				</CollapsibleTrigger>
				<CollapsibleContent className="flex flex-col gap-3 pt-1 pr-2 pb-4 pl-11">
					<p className="text-xs text-muted-foreground">
						Card ·{" "}
						<span className="break-words text-foreground">{card.title}</span>
					</p>
					<EntryProof entry={entry} card={card} />
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
}

/** Face or milestone icon, who and what, then the weekday on the right. */
function EntryLine({
	entry,
	children,
}: {
	readonly entry: EntryView;
	readonly children?: ReactNode;
}) {
	const { actor, text } = entrySummary(entry);
	const Icon =
		entry.kind === "card_verified" ? null : MILESTONE_ICON[entry.kind];

	return (
		<>
			{Icon ? (
				<span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
					<Icon aria-hidden className="size-3.5" />
				</span>
			) : (
				<PersonAvatar person={entry.actor} size={24} />
			)}
			<span className="min-w-0 flex-1 truncate">
				{actor ? (
					<>
						<span
							className={cn(
								"font-medium",
								entry.actor && tierText(entry.actor.rating),
							)}
						>
							{actor}
						</span>
						<span className="text-muted-foreground">
							{entry.kind === "card_verified" ? " · " : " "}
						</span>
					</>
				) : null}
				<span className={cn(Icon && "text-muted-foreground")}>{text}</span>
			</span>
			{children}
			{entry.selfVerified ? (
				<Badge variant="outline" className="text-muted-foreground">
					Self-verified
				</Badge>
			) : null}
			<time
				dateTime={new Date(entry.at).toISOString()}
				className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
			>
				{weekdayLabel(entry.at)}
			</time>
		</>
	);
}

/** How many links and images a Card carries. Hidden on a phone. */
function ProofCounts({
	card,
}: {
	readonly card: NonNullable<EntryView["card"]>;
}) {
	if (card.links.length + card.imageUrls.length === 0) return null;

	return (
		<span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
			{card.links.length > 0 ? (
				<ProofCount icon={Link2} count={card.links.length} label="links" />
			) : null}
			{card.imageUrls.length > 0 ? (
				<ProofCount
					icon={ImageIcon}
					count={card.imageUrls.length}
					label="images"
				/>
			) : null}
		</span>
	);
}

function ProofCount({
	icon: Icon,
	count,
	label,
}: {
	readonly icon: LucideIcon;
	readonly count: number;
	readonly label: string;
}) {
	return (
		<span className="flex items-center gap-0.5 tabular-nums">
			<Icon aria-hidden className="size-3.5" />
			{count}
			<span className="sr-only"> {label}</span>
		</span>
	);
}
