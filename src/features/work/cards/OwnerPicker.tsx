import type { Id } from "@convex/_generated/dataModel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { PersonAvatar } from "~/features/people/PersonAvatar";
import { PersonName } from "~/features/people/PersonName";
import type { CardView } from "../board/types";
import { useTeam } from "./useTeam";

type Person = NonNullable<CardView["owner"]>;

/** A ghost select: no frame until hovered, so the Card panel reads as text. */
export const GHOST_TRIGGER =
	"h-8 w-full border-transparent bg-transparent px-2 hover:border-transparent hover:bg-accent";

function PersonLabel({ person }: { readonly person: Person }) {
	return (
		<span className="flex items-center gap-2">
			<PersonAvatar person={person} size={20} />
			<PersonName person={person} />
		</span>
	);
}

/** Who owns the Card; a plain label when the Card rules fix it (in Review or Done). */
export function OwnerPicker({
	startupId,
	card,
	isLocked,
	onPick,
}: {
	readonly startupId: Id<"startups">;
	readonly card: CardView;
	readonly isLocked: boolean;
	readonly onPick: (ownerId: Id<"users">) => void;
}) {
	const team = useTeam(startupId);

	if (isLocked) {
		return card.owner ? (
			<div className="flex h-8 items-center px-2 text-sm">
				<PersonLabel person={card.owner} />
			</div>
		) : (
			<p className="flex h-8 items-center px-2 text-sm text-muted-foreground">
				No owner
			</p>
		);
	}

	return (
		<Select
			value={card.owner?._id ?? ""}
			onValueChange={(ownerId) => onPick(ownerId as Id<"users">)}
			disabled={!team}
		>
			<SelectTrigger aria-label="Owner" size="sm" className={GHOST_TRIGGER}>
				<SelectValue placeholder="Pick an owner" />
			</SelectTrigger>
			<SelectContent>
				{(team ?? []).map((person) => (
					<SelectItem key={person._id} value={person._id}>
						<PersonLabel person={person} />
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
