import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	loadHackathonCards,
	loadParticipants,
	requireHackathonFounder,
} from "../hackathons/model";
import { MAX_APPLICATIONS, phaseOf } from "../hackathons/rules";
import { type ApplicationAction, applicationRefusal } from "./rules";

type Ctx = QueryCtx | MutationCtx;

/** The person's application to the Hackathon, or null. */
export async function getApplication(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<Doc<"applications"> | null> {
	return await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_user", (q) =>
			q.eq("hackathonId", hackathonId).eq("userId", userId),
		)
		.unique();
}

/** Whether the person is a Participant on the Hackathon (accepted, not declined). */
export async function isParticipant(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<boolean> {
	const application = await getApplication(ctx, hackathonId, userId);
	return application?.status === "participating";
}

/** The person's place on a Hackathon of `startup`: its Founder, a Participant, or neither. */
export async function getHackathonRole(
	ctx: Ctx,
	startup: Doc<"startups">,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<"founder" | "participant" | null> {
	if (startup.founderId === userId) {
		return "founder";
	}
	return (await isParticipant(ctx, hackathonId, userId)) ? "participant" : null;
}

/** The application and its Hackathon, once the person is confirmed as the Founder. */
export async function requireApplicationFounder(
	ctx: Ctx,
	applicationId: Id<"applications">,
	userId: Id<"users">,
): Promise<{ application: Doc<"applications">; hackathon: Doc<"hackathons"> }> {
	const application = await ctx.db.get(applicationId);
	if (!application) {
		throw new ConvexError("Application not found");
	}
	const hackathon = await requireHackathonFounder(
		ctx,
		application.hackathonId,
		userId,
	);
	return { application, hackathon };
}

export function requireOpen(hackathon: Doc<"hackathons">): void {
	if (hackathon.status !== "open") {
		throw new ConvexError("Applications are closed");
	}
}

/** Throws `applicationRefusal`'s reason when the Founder may not do `action` to `application` now. */
export function requireApplicationAllowed(
	application: Doc<"applications">,
	hackathon: Doc<"hackathons">,
	action: ApplicationAction,
): void {
	const refusal = applicationRefusal(
		application,
		phaseOf(hackathon, Date.now()),
		action,
	);
	if (refusal) {
		throw new ConvexError(refusal);
	}
}

/** The Founder's private Thread with a Participant, created once. */
export async function ensurePrivateThread(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	participantId: Id<"users">,
): Promise<void> {
	const existing = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_participant", (q) =>
			q.eq("hackathonId", hackathon._id).eq("participantId", participantId),
		)
		.first();
	if (existing) {
		return;
	}
	await ctx.db.insert("threads", {
		startupId: hackathon.startupId,
		hackathonId: hackathon._id,
		kind: "private",
		participantId,
	});
}

/**
 * A Hackathon's applications for its Founder: every Participant first, then up to
 * MAX_APPLICATIONS others, so a crowd of applicants never hides a Participant.
 */
export async function loadApplicationsForFounder(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"applications">[]> {
	const byStatus = async (status: "applied" | "declined", limit: number) =>
		limit <= 0
			? []
			: await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", hackathonId).eq("status", status),
					)
					.take(limit);

	const participants = await loadParticipants(ctx, hackathonId);
	const others: Doc<"applications">[] = [];
	for (const status of ["applied", "declined"] as const) {
		others.push(...(await byStatus(status, MAX_APPLICATIONS - others.length)));
	}
	return [...participants, ...others];
}

/** How far a Participant has got: their Cards on the Hackathon, and how many are Done. */
export async function loadParticipantProgress(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<{ done: number; total: number }> {
	const cards = await loadHackathonCards(ctx, hackathonId, userId);
	return {
		done: cards.filter((card) => card.status === "done").length,
		total: cards.length,
	};
}

/** What the Founder sees of an application. Leaves out the Participant's private promise answer. */
export function toFounderApplicationView(application: Doc<"applications">) {
	return {
		_id: application._id,
		_creationTime: application._creationTime,
		hackathonId: application.hackathonId,
		userId: application.userId,
		answer: application.answer,
		status: application.status,
		shortlisted: application.shortlisted,
		walkthroughAt: application.walkthroughAt ?? null,
		walkthroughNotes: application.walkthroughNotes ?? null,
		decision: application.decision ?? null,
		feedback: application.feedback ?? null,
	};
}

/** What the Participant sees of their own application: the decision, the Founder's note, and whether they've answered the promise question. */
export function toMyApplicationView(application: Doc<"applications">) {
	return {
		applicationId: application._id,
		status: application.status,
		decision: application.decision ?? null,
		feedback: application.feedback ?? null,
		promiseAnswered: application.promiseKept !== undefined,
	};
}
