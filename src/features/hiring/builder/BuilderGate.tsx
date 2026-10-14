import type { Id } from "@convex/_generated/dataModel";
import { getRouteApi, Navigate, Outlet } from "@tanstack/react-router";
import { createContext, useContext, useMemo } from "react";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import {
	type BoardScope,
	BoardScopeContext,
} from "~/features/work/board/BoardScope";
import { useMe } from "~/shell/useMe";
import { useHackathon } from "../public/useHackathon";
import { type BuilderStatus, builderStatus } from "./builderStatus";

const route = getRouteApi("/_shell/_authed/h/$id");

export type Hackathon = NonNullable<ReturnType<typeof useHackathon>>;
type Builder = {
	page: Hackathon;
	userId: Id<"users">;
	status: BuilderStatus;
};

const BuilderContext = createContext<Builder | null>(null);

/** The Builder's Hackathon and their place in it; only inside `BuilderGate`. */
export function useBuilder(): Builder {
	const builder = useContext(BuilderContext);
	if (!builder) throw new Error("useBuilder outside BuilderGate");
	return builder;
}

/** Loads the Hackathon for its Board and Brief; anyone not building goes to the public post. */
export function BuilderGate() {
	const { id } = route.useParams();
	const page = useHackathon(id);
	const me = useMe();

	if (page === undefined || me === undefined) return <GlobalSpinner fill />;
	if (page === null || me === null) return <GlobalNotFound />;
	if (page.myApplication?.status !== "building") {
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
	const status = builderStatus(
		page,
		page.myApplication?.decision ?? null,
		Date.now(),
	);
	const { isClosed } = status;
	const scope = useMemo<BoardScope>(
		() => ({
			kind: "builder",
			hackathonId: page._id,
			builderId: userId,
			userId,
			isFounder: false,
			isClosed,
		}),
		[page._id, userId, isClosed],
	);
	return (
		<BuilderContext.Provider value={{ page, userId, status }}>
			<BoardScopeContext.Provider value={scope}>
				<Outlet />
			</BoardScopeContext.Provider>
		</BuilderContext.Provider>
	);
}
