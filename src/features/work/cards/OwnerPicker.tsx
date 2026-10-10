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
import { displayName } from "./displayName";
import { useTeam } from "./hooks/useTeam";

type Person = NonNullable<CardView["owner"]>;

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
			<div className="text-sm">
				<PersonLabel person={card.owner} />
			</div>
		) : (
			<p className="text-sm text-muted-foreground">No owner</p>
		);
	}

	return (
		<Select
			value={card.owner?._id ?? ""}
			onValueChange={(ownerId) => onPick(ownerId as Id<"users">)}
			disabled={!team}
		>
			<SelectTrigger aria-label="Owner" size="sm" className="w-full">
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
