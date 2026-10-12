import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_APPLICATIONS,
	MAX_BUILDERS,
	MAX_HACKATHON_CARDS,
} from "../shared/limits";
import { requireHackathonFounder } from "./hackathons";

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

/** Whether the person is a Builder on the Hackathon (accepted, not declined). */
export async function isBuilder(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<boolean> {
	const application = await getApplication(ctx, hackathonId, userId);
	return application?.status === "building";
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

export function requireRunning(hackathon: Doc<"hackathons">): void {
	if (hackathon.status !== "building" && hackathon.status !== "deciding") {
		throw new ConvexError("This Hackathon isn't running");
	}
}

export function requireBuilding(application: Doc<"applications">): void {
	if (application.status !== "building") {
		throw new ConvexError("They're not a Builder");
	}
}

/** Decisions open when the Hackathon ends, even before `startDeciding` has run. */
export function requireDecidable(
	hackathon: Doc<"hackathons">,
	now: number,
): void {
	const ended =
		hackathon.status === "deciding" ||
		(hackathon.status === "building" && now >= hackathon.endsAt);
	if (!ended) {
		throw new ConvexError("Decide after the Hackathon ends");
	}
}

/** The Founder's private Thread with a Builder, created once. */
export async function ensurePrivateThread(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	builderId: Id<"users">,
): Promise<void> {
	const existing = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_builder", (q) =>
			q.eq("hackathonId", hackathon._id).eq("builderId", builderId),
		)
		.first();
	if (existing) {
		return;
	}
	await ctx.db.insert("threads", {
		startupId: hackathon.startupId,
		hackathonId: hackathon._id,
		kind: "private",
		builderId,
	});
}

/**
 * A Hackathon's applications for its Founder: every Builder first, then up to
 * MAX_APPLICATIONS others, so a crowd of applicants never hides a Builder.
 */
export async function loadApplicationsForFounder(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"applications">[]> {
	const byStatus = async (
		status: Doc<"applications">["status"],
		limit: number,
	) =>
		limit <= 0
			? []
			: await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", hackathonId).eq("status", status),
					)
					.take(limit);

	const builders = await byStatus("building", MAX_BUILDERS);
	const others: Doc<"applications">[] = [];
	for (const status of ["applied", "declined", "left"] as const) {
		others.push(...(await byStatus(status, MAX_APPLICATIONS - others.length)));
	}
	return [...builders, ...others];
}

/** How far a Builder has got: their Cards on the Hackathon, and how many are Done. */
export async function loadBuilderProgress(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<{ done: number; total: number }> {
	const cards = await ctx.db
		.query("cards")
		.withIndex("by_hackathon_and_owner", (q) =>
			q.eq("hackathonId", hackathonId).eq("ownerId", userId),
		)
		.take(MAX_HACKATHON_CARDS);
	return {
		done: cards.filter((card) => card.status === "done").length,
		total: cards.length,
	};
}

/** What the Founder sees of an application. Leaves out the Builder's private promise answer. */
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

/** What the Builder sees of their own application: the decision, the Founder's note, and whether they've answered the promise question. */
export function toMyApplicationView(application: Doc<"applications">) {
	return {
		applicationId: application._id,
		status: application.status,
		decision: application.decision ?? null,
		feedback: application.feedback ?? null,
		promiseAnswered: application.promiseKept !== undefined,
	};
}
