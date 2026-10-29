import {
	type CardView,
	COLUMNS,
	type Column,
	ColumnIcon,
	dropAction,
	refusalFor,
	useBoardScope,
} from "~/entities/card";
import {
	GHOST_TRIGGER,
	OwnerPicker,
	type useCardActions,
} from "~/features/edit-card";
import { useMoveCard } from "~/features/move-card";
import { PersonName } from "~/shared/ui/PersonName";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/shared/ui/select";

/** The Card's Column and Owner, each changed in place. */
export function CardFacts({
	card,
	onShip,
	onSave,
}: {
	readonly card: CardView;
	/** Called when the owner picks Review; opens What shipped. */
	readonly onShip: (card: CardView) => void;
	readonly onSave: ReturnType<typeof useCardActions>["update"];
}) {
	const scope = useBoardScope();
	const move = useMoveCard(scope);

	const columns = COLUMNS.filter(
		(column) =>
			column.id === card.status || dropAction(card, column.id, scope) !== null,
	);
	const current = COLUMNS.find((column) => column.id === card.status);

	function changeColumn(to: Column) {
		const action = dropAction(card, to, scope);
		if (action === "ship") {
			onShip(card);
		} else if (action === "move" && (to === "todo" || to === "in_progress")) {
			void move(card._id, to);
		}
	}

	return (
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
						isLocked={refusalFor(card, { kind: "reassign" }, scope) !== null}
						onPick={(ownerId) => void onSave(card._id, { ownerId })}
					/>
				) : (
					<span className="flex h-8 items-center px-2">
						{card.owner ? <PersonName person={card.owner} /> : null}
					</span>
				)}
			</dd>
		</dl>
	);
}
