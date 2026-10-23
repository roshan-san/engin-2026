import { Link } from "@tanstack/react-router";
import { ConfirmButton } from "~/components/ConfirmButton";
import { Row, RowList } from "~/components/RowList";
import { Section } from "~/components/Section";
import { Skeleton } from "~/components/ui/skeleton";
import { PersonAvatar, PersonName } from "~/features/people";
import { RatingBadge } from "~/features/work";
import { displayName } from "~/lib/displayName";
import type { TeamPeople, TeamPerson } from "./useTeamPeople";

/** The Founder and Contributors: face, name, Rating and what they verified this Cycle. */
export function PeopleList({
	people,
	canRemove,
	onRemove,
}: {
	readonly people: TeamPeople | undefined;
	/** The Founder can remove Contributors. */
	readonly canRemove: boolean;
	/** Resolves `true` once removed (the error is shown already otherwise). */
	readonly onRemove: (person: TeamPerson) => Promise<boolean>;
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
								<ConfirmButton
									label="Remove"
									title={`Remove ${displayName(person)}?`}
									description="They lose access to this Board."
									actionLabel="Remove"
									onConfirm={() => onRemove(person)}
								/>
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
