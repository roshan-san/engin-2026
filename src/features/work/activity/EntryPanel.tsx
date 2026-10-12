import { ChevronLeftIcon, XIcon } from "lucide-react";
import { PanelHeader } from "~/components/PanelHeader";
import { SectionLabel } from "~/components/SectionLabel";
import { Button } from "~/components/ui/button";
import { displayName } from "../../../lib/displayName";
import { ActorAvatar } from "./ActorAvatar";
import { EntryProof } from "./EntryProof";
import { type CycleView, type EntryView, entryDate } from "./record";

/** One verified Card's What shipped and proof, in the side panel. */
export function EntryPanel({
	entry,
	cycle,
	onBack,
	onClose,
}: {
	readonly entry: EntryView;
	readonly cycle: CycleView;
	/** Back to the Record. */
	readonly onBack: () => void;
	/** On a phone, closes the sheet the panel sits in. */
	readonly onClose?: () => void;
}) {
	const { card } = entry;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<PanelHeader className="pl-2">
				{onClose ? null : (
					<Button
						variant="ghost"
						size="sm"
						aria-label="Back to Record"
						onClick={onBack}
					>
						<ChevronLeftIcon />
						Record
					</Button>
				)}
				{onClose ? (
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Close"
						className="ml-auto"
						onClick={onClose}
					>
						<XIcon />
					</Button>
				) : null}
			</PanelHeader>
			<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2 text-sm">
						<ActorAvatar person={entry.actor} />
						<span className="font-medium">{displayName(entry.actor)}</span>
					</div>
					<p className="text-base font-medium break-words">
						{entry.line ?? card?.title}
					</p>
					<p className="text-xs text-muted-foreground">
						Cycle {cycle.number} · {entryDate(entry.at)}
					</p>
				</div>
				{card ? (
					<>
						<section className="flex flex-col gap-2">
							<SectionLabel as="h3">Card</SectionLabel>
							<p className="text-sm break-words">{card.title}</p>
						</section>
						<section className="flex flex-col gap-3">
							<SectionLabel as="h3">Proof</SectionLabel>
							<EntryProof entry={entry} card={card} size="panel" />
						</section>
					</>
				) : null}
			</div>
		</div>
	);
}
