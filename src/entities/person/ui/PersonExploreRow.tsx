import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { disciplineLabel } from "~/shared/config/disciplines";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { PersonName } from "~/shared/ui/PersonName";
import { RatingBadge } from "~/shared/ui/RatingBadge";
import { TrustLabel } from "~/shared/ui/TrustLabel";

type PersonExploreRowData = FunctionReturnType<
	typeof api.users.explore
>[number];

/** One person: who they are, their discipline and Momentum. */
export function PersonExploreRow({
	person,
}: {
	readonly person: PersonExploreRowData;
}) {
	// `users.explore` leaves out anyone without a username.
	if (!person.username) return null;

	return (
		<li>
			<Link
				to="/u/$username"
				params={{ username: person.username }}
				className="flex items-center justify-between gap-4 px-2 py-4 transition-colors hover:bg-accent focus-ring"
			>
				<div className="flex min-w-0 items-center gap-3">
					<PersonAvatar person={person} size={40} />
					<div className="flex min-w-0 flex-col">
						<PersonName person={person} className="truncate font-medium" />
						{person.discipline ? (
							<span className="truncate text-sm text-muted-foreground">
								{disciplineLabel(person.discipline)}
							</span>
						) : null}
					</div>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-0.5">
					<RatingBadge
						size="sm"
						inLink
						rating={person.momentum}
						ratingChange={person.momentumChange}
						isProvisional={person.isProvisional}
					/>
					<TrustLabel trust={person.trust} className="text-xs" />
				</div>
			</Link>
		</li>
	);
}
