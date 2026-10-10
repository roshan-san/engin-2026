import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireHackathonFounder } from "./hackathons.rules";

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
		throw new Error("Application not found");
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
		throw new Error("Applications are closed");
	}
}

export function requireRunning(hackathon: Doc<"hackathons">): void {
	if (hackathon.status !== "building" && hackathon.status !== "deciding") {
		throw new Error("This Hackathon isn't running");
	}
}

export function requireBuilding(application: Doc<"applications">): void {
	if (application.status !== "building") {
		throw new Error("They're not a Builder");
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
		throw new Error("Decide after the Hackathon ends");
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
