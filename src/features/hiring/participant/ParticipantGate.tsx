import type { Id } from "@convex/_generated/dataModel";
import { phaseOf } from "@convex/shared/hackathonPhase";
import { getRouteApi, Navigate, Outlet } from "@tanstack/react-router";
import { createContext, useContext, useMemo } from "react";
import { type BoardScope, BoardScopeContext } from "~/features/work";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { useMe } from "~/shell/useMe";
import { useHackathon } from "../public/useHackathon";
import { type ParticipantStatus, participantStatus } from "./participantStatus";

const route = getRouteApi("/_shell/_authed/h/$id");

export type Hackathon = NonNullable<ReturnType<typeof useHackathon>>;
type Participant = {
	page: Hackathon;
	userId: Id<"users">;
	status: ParticipantStatus;
};

const ParticipantContext = createContext<Participant | null>(null);

/** The Participant's Hackathon and their place in it; only inside `ParticipantGate`. */
export function useParticipant(): Participant {
	const participant = useContext(ParticipantContext);
	if (!participant) throw new Error("useParticipant outside ParticipantGate");
	return participant;
}

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
