import { TEXT } from "@convex/shared/limits";
import { ChevronLeftIcon, MoreHorizontalIcon, XIcon } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { Kbd } from "~/components/Kbd";
import { PanelHeader } from "~/components/PanelHeader";
import { SectionLabel } from "~/components/SectionLabel";
import { UnreadDot } from "~/components/UnreadDot";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { isReadOnly, useBoardScope } from "../board/BoardScope";
import { ColumnIcon } from "../board/ColumnIcon";
import { COLUMNS, type Column, dropAction } from "../board/dropRules";
import { useBoard } from "../board/hooks/useBoard";
import type { CardView } from "../board/types";
import { displayName } from "../../../lib/displayName";
import { useCard } from "./hooks/useCard";
import { useCardActions } from "./hooks/useCardActions";
import { useDraft } from "./hooks/useDraft";
import { NotesField } from "./NotesField";
import { GHOST_TRIGGER, OwnerPicker } from "./OwnerPicker";
import { ShippedView } from "./ShippedView";

type PanelProps = {
	/** Where Back goes: "Threads", "Thread". */
	readonly backLabel: string;
	/** Whether that place has messages you haven't read, shown on the way back. */
	readonly isBackUnread: boolean;
	/** Leaves the Card for the thread panel. */
	readonly onBack: () => void;
	/** On a phone, closes the sheet the panel sits in. */
	readonly onClose?: () => void;
};

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
					This Card isn't here.
				</p>
			</div>
		);
	}

	return <OpenCard card={card} onShip={onShip} {...panel} />;
}

/** Back to Threads on the left; the Card's menu and, on a phone, close on the right. */
function CardHeader({
	backLabel,
	isBackUnread,
	onBack,
	onClose,
	children,
}: PanelProps & { readonly children?: ReactNode }) {
	return (
		<PanelHeader className="pl-2">
			<Button
				variant="ghost"
				size="sm"
				aria-label={`Back to ${backLabel}`}
				onClick={onBack}
			>
				<ChevronLeftIcon />
				{backLabel}
				{isBackUnread ? <UnreadDot /> : null}
			</Button>
			<div className="ml-auto flex items-center gap-1">
				{children}
				{onClose ? (
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Close"
						onClick={onClose}
					>
						<XIcon />
					</Button>
				) : null}
			</div>
		</PanelHeader>
	);
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
	const { userId, isFounder } = scope;
	const { move, verify } = useBoard(scope);
	const isLocked = isReadOnly(scope);
	const { update, remove } = useCardActions();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const isDeleting = useRef(false);

	const viewer = { userId, isFounder };
	const isDone = card.status === "done";
	const columns = isLocked
		? []
		: COLUMNS.filter(
				(column) =>
					column.id === card.status ||
					dropAction(card, column.id, viewer) !== null,
			);
	const current = COLUMNS.find((column) => column.id === card.status);
	// Hackathon Cards stay with their Builder until the end.
	const canDelete =
		scope.kind === "startup" &&
		!isDone &&
		(isFounder || card.owner?._id === userId);
	const canVerify = isFounder && !isLocked && card.status === "review";

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

			<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pt-4 pb-6">
				<TitleField card={card} isLocked={isDone || isLocked} onSave={update} />

				<dl className="-mt-2 grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1 text-sm">
					<dt className="text-muted-foreground">Column</dt>
					<dd className="flex min-w-0 items-center gap-2">
						{columns.length < 2 ? (
							<span className="flex h-8 items-center gap-2 px-2">
								<ColumnIcon column={card.status} />
								{current?.label}
							</span>
						) : (
							<Select
								value={card.status}
								onValueChange={(to) => changeColumn(to as Column)}
							>
								<SelectTrigger
									aria-label="Column"
									size="sm"
									className={GHOST_TRIGGER}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{columns.map((column) => (
										<SelectItem key={column.id} value={column.id}>
											<ColumnIcon column={column.id} />
											{column.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</dd>
					<dt className="text-muted-foreground">Owner</dt>
					<dd className="min-w-0">
						{scope.kind === "startup" ? (
							<OwnerPicker
								startupId={scope.startupId}
								card={card}
								onPick={(ownerId) => void update(card._id, { ownerId })}
							/>
						) : (
							<span className="flex h-8 items-center px-2">
								{card.owner ? displayName(card.owner) : null}
							</span>
						)}
					</dd>
				</dl>

				{card.changesAsked ? (
					<Badge variant="status" tone="warning" className="-mt-3">
						Changes asked
					</Badge>
				) : null}

				<section className="flex flex-col gap-2">
					<SectionLabel as="h3">Notes</SectionLabel>
					<NotesField
						card={card}
						isReadOnly={isLocked}
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
			</div>

			{canVerify ? (
				<div className="shrink-0 border-t border-border p-3">
					<Button
						className="w-full"
						disabled={isVerifying}
						onClick={() => void handleVerify()}
					>
						{isVerifying ? <Spinner /> : null}
						Verify
						<Kbd className="border-primary-foreground/20 text-primary-foreground/60">
							V
						</Kbd>
					</Button>
				</div>
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

/** The title, edited in place; saves on blur or Enter, Esc undoes. Wraps, but stays one line. */
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
