import type { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { createContext, useContext } from "react";
import type { ParticipantStatus } from "./participantStatus";

export type Hackathon = NonNullable<
	FunctionReturnType<typeof api.hackathons.getPublic>
>;

type Participant = {
	page: Hackathon;
	userId: Id<"users">;
	status: ParticipantStatus;
};

export const ParticipantContext = createContext<Participant | null>(null);

/** The Participant's Hackathon and their place in it; only inside `ParticipantGate`. */
export function useParticipant(): Participant {
	const participant = useContext(ParticipantContext);
	if (!participant) throw new Error("useParticipant outside ParticipantGate");
	return participant;
}
