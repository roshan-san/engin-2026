import { ChevronLeftIcon, XIcon } from "lucide-react";
import { dayLabel } from "~/shared/lib/dates";
import { Button } from "~/shared/ui/button";
import { PanelBody } from "~/shared/ui/PanelBody";
import { PanelHeader } from "~/shared/ui/PanelHeader";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { PersonName } from "~/shared/ui/PersonName";
import { Section } from "~/shared/ui/Section";
import { EntryProof } from "./EntryProof";
import type { CycleView, EntryView } from "./record";

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
			<PanelBody>
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2 text-sm">
						<PersonAvatar person={entry.actor} size={24} />
						<PersonName person={entry.actor} className="font-medium" />
					</div>
					<p className="text-lg font-semibold break-words">
						{entry.line ?? card?.title}
					</p>
					<p className="text-xs text-muted-foreground">
						Cycle {cycle.number} · {dayLabel(entry.at)}
					</p>
				</div>
				{card ? (
					<>
						<Section label="Card" as="h3">
							<p className="text-sm break-words">{card.title}</p>
						</Section>
						<Section label="What shipped" as="h3">
							<EntryProof entry={entry} card={card} size="panel" />
						</Section>
					</>
				) : null}
			</PanelBody>
		</div>
	);
}
