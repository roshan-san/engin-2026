import { Link } from "@tanstack/react-router";
import { Row, RowList } from "~/components/RowList";
import { SectionLabel } from "~/components/SectionLabel";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { initials } from "~/lib/initials";
import type { TeamPeople, TeamPerson } from "./hooks/useTeamPeople";

function displayName(person: TeamPerson) {
	return person.name ?? person.username ?? "Someone";
}

/** The Founder and Contributors: face, name, Rating and what they verified this Cycle. */
export function PeopleList({
	people,
	canRemove,
	onRemove,
}: {
	readonly people: TeamPeople | undefined;
	/** The Founder can remove Contributors. */
	readonly canRemove: boolean;
	readonly onRemove: (person: TeamPerson) => Promise<void>;
}) {
	if (people === undefined) {
		return (
			<div className="flex flex-col gap-3">
				<Skeleton className="h-12" />
				<Skeleton className="h-12" />
			</div>
		);
	}

	return (
		<section className="flex flex-col gap-1">
			<SectionLabel>People</SectionLabel>
			<RowList>
				{people.founder ? (
					<PersonRow person={people.founder} position="Founder" />
				) : null}
				{people.contributors.map((person) => (
					<PersonRow
						key={person._id}
						person={person}
						position="Contributor"
						remove={
							canRemove ? (
								<RemoveButton person={person} onRemove={onRemove} />
							) : null
						}
					/>
				))}
			</RowList>
		</section>
	);
}

function PersonRow({
	person,
	position,
	remove,
}: {
	readonly person: TeamPerson;
	readonly position: "Founder" | "Contributor";
	readonly remove?: React.ReactNode;
}) {
	const name = displayName(person);

	return (
		<Row
			leading={
				<Avatar className="size-9">
					{person.image ? <AvatarImage src={person.image} alt="" /> : null}
					<AvatarFallback className="text-xs">
						{initials(person.name, person.username)}
					</AvatarFallback>
				</Avatar>
			}
			title={
				person.username ? (
					<Link
						to="/u/$username"
						params={{ username: person.username }}
						className="hover:underline"
					>
						{name}
					</Link>
				) : (
					name
				)
			}
			meta={
				person.verifiedThisCycle > 0
					? `${position} · ${person.verifiedThisCycle} verified this Cycle`
					: position
			}
			trailing={
				<div className="flex items-center gap-3">
					<RatingBadge
						size="sm"
						rating={person.rating}
						ratingChange={person.ratingChange}
						isProvisional={person.isProvisional}
					/>
					{remove}
				</div>
			}
		/>
	);
}

function RemoveButton({
	person,
	onRemove,
}: {
	readonly person: TeamPerson;
	readonly onRemove: (person: TeamPerson) => Promise<void>;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" size="sm" className="text-muted-foreground">
					Remove
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remove {displayName(person)}?</AlertDialogTitle>
					<AlertDialogDescription>
						They lose access to this Board.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={() => void onRemove(person)}>
						Remove
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
