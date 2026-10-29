import type { CardAction } from "@convex/shared/cardRules";
import { MoreHorizontalIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
	type CardView,
	refusalFor,
	ShippedView,
	useBoardScope,
	useCard,
} from "~/entities/card";
import { NotesField, TitleField, useCardActions } from "~/features/edit-card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/shared/ui/alert-dialog";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/shared/ui/dropdown-menu";
import { PanelBody } from "~/shared/ui/PanelBody";
import { Section } from "~/shared/ui/Section";
import { Skeleton } from "~/shared/ui/skeleton";
import { CardFacts } from "./CardFacts";
import { CardHeader, type PanelProps } from "./CardHeader";
import { ReviewBar } from "./ReviewBar";
import { useCardFocus } from "./useCardFocus";

/** The open Card: edit it, move it, and (for the Founder) Verify it. */
export function CardPanel({
	cardId,
	onShip,
	...panel
}: PanelProps & {
	readonly cardId: string;
	/** Called when the owner picks Review; opens What shipped. */
	readonly onShip: (card: CardView) => void;
}) {
	const card = useCard(useBoardScope(), cardId);

	if (card === undefined) {
		return (
			<div className="flex min-h-0 flex-1 flex-col">
				<CardHeader {...panel} />
				<div className="flex flex-col gap-3 p-4">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-24 w-full" />
				</div>
			</div>
		);
	}
	if (card === null) {
		return (
			<div className="flex min-h-0 flex-1 flex-col">
				<CardHeader {...panel} />
				<p className="p-4 text-sm text-muted-foreground">
					This Card doesn't exist.
				</p>
			</div>
		);
	}

	return <OpenCard card={card} onShip={onShip} {...panel} />;
}

function OpenCard({
	card,
	onShip,
	...panel
}: PanelProps & {
	readonly card: CardView;
	readonly onShip: (card: CardView) => void;
}) {
	const scope = useBoardScope();
	const { update, remove } = useCardActions();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const notesRef = useRef<HTMLTextAreaElement>(null);
	const isDeleting = useRef(false);
	const panelRef = useRef<HTMLDivElement>(null);
	useCardFocus(card, panelRef, isDeleting);

	const can = (action: CardAction) => refusalFor(card, action, scope) === null;
	const canDelete = can({ kind: "delete" });
	const canVerify = can({ kind: "verify" });
	const canSendBack =
		card.status === "review" && can({ kind: "move", to: "in_progress" });

	// Reviewing: the work comes first, then the Founder's notes on it.
	const isReviewing = card.status === "review" && canVerify;
	const shipped = card.shipped ? (
		<Section label="What shipped" as="h3">
			<ShippedView card={card} />
		</Section>
	) : null;

	return (
		<div
			ref={panelRef}
			data-testid="card-panel"
			tabIndex={-1}
			className="flex min-h-0 flex-1 flex-col outline-none"
		>
			<CardHeader {...panel}>
				{canDelete ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon-sm" aria-label="More">
								<MoreHorizontalIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => setIsConfirmingDelete(true)}>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</CardHeader>

			<PanelBody className="pb-6">
				<TitleField
					card={card}
					isLocked={!can({ kind: "retitle" })}
					onSave={update}
				/>

				<CardFacts card={card} onShip={onShip} onSave={update} />

				{card.changesAsked ? (
					<Badge variant="status" tone="warning" className="-mt-3">
						Changes asked
					</Badge>
				) : null}

				{isReviewing ? shipped : null}

				<Section label="Notes" as="h3">
					<NotesField
						card={card}
						inputRef={notesRef}
						isReadOnly={!can({ kind: "editNotes" })}
						isDiscarded={isDeleting}
						onSave={(notes) => update(card._id, { notes })}
					/>
				</Section>

				{isReviewing ? null : shipped}
			</PanelBody>

			{canVerify ? (
				<ReviewBar
					card={card}
					canSendBack={canSendBack}
					onSentBack={() => notesRef.current?.focus()}
				/>
			) : null}

			<AlertDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this Card?</AlertDialogTitle>
						<AlertDialogDescription className="truncate">
							{card.title}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								// Leave first, so a gone Card never shows and its notes aren't saved.
								isDeleting.current = true;
								panel.onBack();
								void remove(card._id);
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
