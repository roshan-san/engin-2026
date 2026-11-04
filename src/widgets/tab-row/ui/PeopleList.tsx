import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import {
	type TeamPeople,
	type TeamPerson,
	teamRoleLine,
} from "~/entities/contributor";
import { useMe } from "~/entities/person";
import { EditLabelButton } from "~/features/edit-team-label";
import { displayName } from "~/shared/lib/displayName";
import { ConfirmButton } from "~/shared/ui/ConfirmButton";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { PersonName } from "~/shared/ui/PersonName";
import { RatingBadge } from "~/shared/ui/RatingBadge";
import { Row, RowList } from "~/shared/ui/RowList";
import { Section } from "~/shared/ui/Section";
import { Skeleton } from "~/shared/ui/skeleton";

/** The Founder, Co-founders and Contributors: face, name, team role and Momentum. */
export function PeopleList({
	startupId,
	people,
	canRemove,
	onRemove,
	onSetCoFounder,
}: {
	readonly startupId: Id<"startups">;
	readonly people: TeamPeople | undefined;
	/** The Founder can remove Contributors. */
	readonly canRemove: boolean;
	/** Resolves `true` once removed (the error is shown already otherwise). */
	readonly onRemove: (person: TeamPerson) => Promise<boolean>;
	/** Only the Founder makes Co-founders; absent for everyone else. */
	readonly onSetCoFounder?: (
		person: TeamPerson,
		isFounder: boolean,
	) => Promise<boolean>;
}) {
	const me = useMe();

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
						position={`${person.isFounder ? "Co-founder" : "Contributor"} · ${teamRoleLine(person)}`}
						actions={
							<>
								{person._id === me?._id ? (
									<EditLabelButton startupId={startupId} label={person.label} />
								) : null}
								{onSetCoFounder ? (
									<ConfirmButton
										label={
											person.isFounder ? "Make Contributor" : "Make Co-founder"
										}
										title={
											person.isFounder
												? `Make ${displayName(person)} a Contributor?`
												: `Make ${displayName(person)} a Co-founder?`
										}
										description={
											person.isFounder
												? "They stop approving Cards and running Hackathons."
												: "They can do everything you can, except billing and making Co-founders."
										}
										actionLabel={
											person.isFounder ? "Make Contributor" : "Make Co-founder"
										}
										onConfirm={() => onSetCoFounder(person, !person.isFounder)}
									/>
								) : null}
								{canRemove ? (
									<ConfirmButton
										label="Remove"
										title={`Remove ${displayName(person)}?`}
										description="They lose access to this Startup."
										actionLabel="Remove"
										onConfirm={() => onRemove(person)}
									/>
								) : null}
							</>
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
	actions,
}: {
	readonly person: NonNullable<TeamPeople["founder"]>;
	readonly position: string;
	readonly actions?: React.ReactNode;
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
			meta={position}
			trailing={
				<div className="flex items-center gap-3">
					<RatingBadge
						size="sm"
						rating={person.momentum}
						ratingChange={person.momentumChange}
						isProvisional={person.isProvisional}
					/>
					{actions}
				</div>
			}
		/>
	);
}
