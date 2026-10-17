import type { CardAction } from "@convex/shared/cardRules";
import { TEXT } from "@convex/shared/limits";
import { ChevronLeftIcon, MoreHorizontalIcon, XIcon } from "lucide-react";
import {
	type ReactNode,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";
import { Kbd } from "~/components/Kbd";
import { PanelBody } from "~/components/PanelBody";
import { PanelHeader } from "~/components/PanelHeader";
import { Section } from "~/components/Section";
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
import { PersonName } from "~/features/people/PersonName";
import { useBoardScope } from "../board/BoardScope";
import { ColumnIcon } from "../board/ColumnIcon";
import { COLUMNS, type Column, dropAction } from "../board/dropRules";
import type { CardView } from "../board/types";
import { useBoard } from "../board/useBoard";
import { refusalFor } from "../cardRules";
import { NotesField } from "./NotesField";
import { GHOST_TRIGGER, OwnerPicker } from "./OwnerPicker";
import { ShippedView } from "./ShippedView";
import { useCard } from "./useCard";
import { useCardActions } from "./useCardActions";
import { useDraft } from "./useDraft";

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
					This Card doesn't exist.
				</p>
			</div>
		);
	}

	return <OpenCard card={card} onShip={onShip} {...panel} />;
}

/**
 * Keyboard focus around the open Card. Opened from a keyboard-focused tile
 * (Enter), focus moves to the title so you can edit at once. When the panel
 * goes (Esc, Back, close, delete) and focus has nowhere left to be, it returns
 * to that Card's tile, or its column when the Card is gone.
 */
function useCardFocus(
	card: CardView,
	titleRef: RefObject<HTMLElement | null>,
	isDeleting: RefObject<boolean>,
) {
	const columnRef = useRef(card.status);
	columnRef.current = card.status;
	const isMounted = useRef(false);

	useEffect(() => {
		isMounted.current = true;
		const tile = document.activeElement;
		if (
			tile instanceof HTMLElement &&
			tile.dataset.cardId === card._id &&
			tile.matches(":focus-visible")
		) {
			titleRef.current?.focus();
		}
		return () => {
			isMounted.current = false;
			// After this render and any dialog's own focus return have settled.
			setTimeout(() => {
				if (isMounted.current || document.activeElement !== document.body) {
					return;
				}
				// A deleted Card's tile is about to go, so land on its column.
				const tile = isDeleting.current
					? null
					: document.querySelector<HTMLElement>(`[data-card-id="${card._id}"]`);
				const column = document.querySelector<HTMLElement>(
					`[data-column="${columnRef.current}"]`,
				);
				(tile ?? column)?.focus();
			}, 0);
		};
	}, [card._id, titleRef, isDeleting]);
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
	const { move, verify } = useBoard(scope);
	const { update, remove } = useCardActions();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const isDeleting = useRef(false);
	const titleRef = useRef<HTMLTextAreaElement>(null);
	useCardFocus(card, titleRef, isDeleting);

	const can = (action: CardAction) => refusalFor(card, action, scope) === null;
	const columns = COLUMNS.filter(
		(column) =>
			column.id === card.status || dropAction(card, column.id, scope) !== null,
	);
	const current = COLUMNS.find((column) => column.id === card.status);
	const canDelete = can({ kind: "delete" });
	const canVerify = can({ kind: "verify" });

	function changeColumn(to: Column) {
		const action = dropAction(card, to, scope);
		if (action === "ship") {
			onShip(card);
		} else if (action === "move" && (to === "todo" || to === "in_progress")) {
			void move(card._id, to);
		}
	}

	async function handleVerify() {
		setIsVerifying(true);
		await verify(card);
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

			<PanelBody className="pb-6">
				<TitleField
					card={card}
					inputRef={titleRef}
					isLocked={!can({ kind: "retitle" })}
					onSave={update}
				/>

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
								isLocked={!can({ kind: "reassign" })}
								onPick={(ownerId) => void update(card._id, { ownerId })}
							/>
						) : (
							<span className="flex h-8 items-center px-2">
								{card.owner ? <PersonName person={card.owner} /> : null}
							</span>
						)}
					</dd>
				</dl>

				{card.changesAsked ? (
					<Badge variant="status" tone="warning" className="-mt-3">
						Changes asked
					</Badge>
				) : null}

				<Section label="Notes" as="h3">
					<NotesField
						card={card}
						isReadOnly={!can({ kind: "editNotes" })}
						isDiscarded={isDeleting}
						onSave={(notes) => update(card._id, { notes })}
					/>
				</Section>

				{card.shipped ? (
					<Section label="What shipped" as="h3">
						<ShippedView card={card} />
					</Section>
				) : null}
			</PanelBody>

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
	inputRef,
	isLocked,
	onSave,
}: {
	readonly card: CardView;
	readonly inputRef: RefObject<HTMLTextAreaElement | null>;
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
			ref={inputRef}
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
