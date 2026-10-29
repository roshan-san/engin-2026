import type { Id } from "@convex/_generated/dataModel";
import { phaseOf } from "@convex/shared/hackathonPhase";
import { getRouteApi, Navigate, Outlet } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	type Hackathon,
	ParticipantContext,
	participantStatus,
} from "~/entities/application";
import { type BoardScope, BoardScopeContext } from "~/entities/card";
import { useHackathon } from "~/entities/hackathon";
import { useMe } from "~/entities/person";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";

const route = getRouteApi("/_shell/_authed/h/$id");

/** Loads the Hackathon for its Board and Brief; anyone not participating goes to the public post. */
export function ParticipantGate() {
	const { id } = route.useParams();
	const page = useHackathon(id);
	const me = useMe();

	if (page === undefined || me === undefined) return <GlobalSpinner fill />;
	if (page === null || me === null) return <GlobalNotFound />;
	if (page.myApplication?.status !== "participating") {
		return <Navigate to="/hackathons/$id" params={{ id }} replace />;
	}
	return <Provided page={page} userId={me._id} />;
}

function Provided({
	page,
	userId,
}: {
	readonly page: Hackathon;
	readonly userId: Id<"users">;
}) {
	const status = participantStatus(
		page,
		page.myApplication?.decision ?? null,
		Date.now(),
	);
	const phase = phaseOf(page, Date.now());
	const scope = useMemo<BoardScope>(
		() => ({
			kind: "participant",
			hackathonId: page._id,
			participantId: userId,
			userId,
			role: "participant",
			phase,
		}),
		[page._id, userId, phase],
	);
	return (
		<ParticipantContext.Provider value={{ page, userId, status }}>
			<BoardScopeContext.Provider value={scope}>
				<Outlet />
			</BoardScopeContext.Provider>
		</ParticipantContext.Provider>
	);
}
