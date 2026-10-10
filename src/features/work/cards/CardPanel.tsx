import { TEXT } from "@convex/lib/limits";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { SectionLabel } from "~/components/shared/SectionLabel";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { COLUMNS, type Column, dropAction } from "../board/dropRules";
import { useBoard } from "../board/hooks/useBoard";
import { useWorkspace } from "../board/StartupContext";
import type { CardView } from "../board/types";
import { useCard } from "./hooks/useCard";
import { useCardActions } from "./hooks/useCardActions";
import { useDraft } from "./hooks/useDraft";
import { NotesField } from "./NotesField";
import { OwnerPicker } from "./OwnerPicker";
import { ShippedView } from "./ShippedView";

/** The open Card: edit it, move it, and (for the Founder) Verify it. */
export function CardPanel({
	cardId,
	onClose,
	onShip,
}: {
	readonly cardId: string;
	readonly onClose: () => void;
	/** Called when the owner picks Review; opens What shipped. */
	readonly onShip: (card: CardView) => void;
}) {
	const { startup } = useWorkspace();
	const card = useCard(startup._id, cardId);

	if (card === undefined) {
		return (
			<div className="flex flex-col gap-3 p-4">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-6 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}
	if (card === null) {
		return (
			<div className="p-4">
				<p className="text-sm">This Card isn't here.</p>
			</div>
		);
	}

	return <OpenCard card={card} onClose={onClose} onShip={onShip} />;
}

function OpenCard({
	card,
	onClose,
	onShip,
}: {
	readonly card: CardView;
	readonly onClose: () => void;
	readonly onShip: (card: CardView) => void;
}) {
	const { startup, userId, isFounder } = useWorkspace();
	const { move, verify } = useBoard(startup._id);
	const { update, remove } = useCardActions();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const isDeleting = useRef(false);

	const viewer = { userId, isFounder };
	const isDone = card.status === "done";
	const columns = COLUMNS.filter(
		(column) =>
			column.id === card.status || dropAction(card, column.id, viewer) !== null,
	);
	const canDelete = !isDone && (isFounder || card.owner?._id === userId);
	const canVerify = isFounder && card.status === "review";

	function changeColumn(to: Column) {
		const action = dropAction(card, to, viewer);
		if (action === "ship") {
			onShip(card);
		} else if (action === "move" && (to === "todo" || to === "in_progress")) {
			void move(card._id, to);
		}
	}

	async function handleVerify() {
		setIsVerifying(true);
		await verify(card._id);
		setIsVerifying(false);
	}

	return (
		<div data-testid="card-panel" className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-center gap-2 border-b border-border px-4 py-3">
				<Select
					value={card.status}
					onValueChange={(to) => changeColumn(to as Column)}
					disabled={columns.length < 2}
				>
					<SelectTrigger aria-label="Column" size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{columns.map((column) => (
							<SelectItem key={column.id} value={column.id}>
								{column.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{card.changesAsked ? (
					<Badge variant="status" tone="warning">
						Changes asked
					</Badge>
				) : null}
				<div className="ml-auto flex items-center gap-1">
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
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Close"
						onClick={onClose}
					>
						<XIcon />
					</Button>
				</div>
			</div>

			<div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
				<TitleField card={card} isLocked={isDone} onSave={update} />

				<section className="flex flex-col gap-2">
					<SectionLabel as="h3">Owner</SectionLabel>
					<OwnerPicker
						startupId={startup._id}
						card={card}
						onPick={(ownerId) => void update(card._id, { ownerId })}
					/>
				</section>

				<section className="flex flex-col gap-2">
					<SectionLabel as="h3">Notes</SectionLabel>
					<NotesField
						card={card}
						isDiscarded={isDeleting}
						onSave={(notes) => update(card._id, { notes })}
					/>
				</section>

				{card.shipped ? (
					<section className="flex flex-col gap-2">
						<SectionLabel as="h3">What shipped</SectionLabel>
						<ShippedView card={card} />
					</section>
				) : null}

				{canVerify ? (
					<Button
						className="self-start"
						disabled={isVerifying}
						onClick={() => void handleVerify()}
					>
						{isVerifying ? <Spinner /> : null}
						Verify
					</Button>
				) : null}
			</div>

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
								// Close first, so a gone Card never shows and its notes aren't saved.
								isDeleting.current = true;
								onClose();
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

/** The title, edited in place; saves on blur or Enter, Esc undoes. */
function TitleField({
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
		return <h2 className="text-base font-medium break-words">{card.title}</h2>;
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
		<Input
			aria-label="Title"
			value={draft}
			maxLength={TEXT.cardTitle}
			className="-mx-2 h-auto w-[calc(100%+1rem)] border-transparent px-2 py-1 text-base font-medium"
			onChange={(e) => setDraft(e.target.value)}
			onFocus={() => setIsFocused(true)}
			onBlur={() => {
				setIsFocused(false);
				void save();
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" && !e.nativeEvent.isComposing) {
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
