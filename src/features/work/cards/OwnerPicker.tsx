import type { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { initials } from "~/lib/initials";
import type { CardView } from "../board/types";
import { displayName } from "../../../lib/displayName";
import { useTeam } from "./hooks/useTeam";

type Person = NonNullable<CardView["owner"]>;

/** A ghost select: no frame until hovered, so the Card panel reads as text. */
export const GHOST_TRIGGER =
	"h-8 w-full border-transparent bg-transparent px-2 hover:border-transparent hover:bg-accent";

function PersonLabel({ person }: { readonly person: Person }) {
	return (
		<span className="flex items-center gap-2">
			<Avatar className="size-5">
				{person.image ? <AvatarImage src={person.image} alt="" /> : null}
				<AvatarFallback className="text-[9px]">
					{initials(person.name, person.username)}
				</AvatarFallback>
			</Avatar>
			{displayName(person)}
		</span>
	);
}

/** Who owns the Card. Fixed once it is in Review or Done. */
export function OwnerPicker({
	startupId,
	card,
	onPick,
}: {
	readonly startupId: Id<"startups">;
	readonly card: CardView;
	readonly onPick: (ownerId: Id<"users">) => void;
}) {
	const team = useTeam(startupId);
	const isLocked = card.status === "review" || card.status === "done";

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
