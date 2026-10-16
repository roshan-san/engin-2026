import { Link } from "@tanstack/react-router";
import { Row, RowList } from "~/components/RowList";
import { Section } from "~/components/Section";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { PersonAvatar } from "~/features/people/PersonAvatar";
import { PersonName } from "~/features/people/PersonName";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import type { TeamPeople, TeamPerson } from "./useTeamPeople";

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
		<Section label="People">
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
		</Section>
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
	return (
		<Row
			leading={<PersonAvatar person={person} size={32} />}
			title={
				person.username ? (
					<Link
						to="/u/$username"
						params={{ username: person.username }}
						className="hover:underline"
					>
						<PersonName person={person} />
					</Link>
				) : (
					<PersonName person={person} />
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
