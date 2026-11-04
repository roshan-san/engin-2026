import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appendActivity } from "../activity/model";
import { offerEmail, placeReleasedEmail } from "../email/copy";
import { emailUser, hackathonNames } from "../email/model";
import { siteUrl } from "../email/rules";
import {
	loadHackathonCards,
	loadParticipants,
	requireHackathonFounder,
} from "../hackathons/model";
import { MAX_APPLICATIONS, phaseOf } from "../hackathons/rules";
import {
	ensureHireInvite,
	loadOpenInvitesTo,
	normalizeEmail,
} from "../invites/model";
import { INVITE_TTL_MS } from "../invites/rules";
import { getTeamRole } from "../startups/team";
import {
	type ApplicationAction,
	applicationRefusal,
	isUnconfirmed,
	isWalkthroughRequested,
	type OfferState,
	offerState,
} from "./rules";

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
	if ((await getTeamRole(ctx, startup._id, userId)) === "founder") {
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

/** The Founder's private Thread with this person on the Hackathon, or null. */
export async function getPrivateThread(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	participantId: Id<"users">,
): Promise<Doc<"threads"> | null> {
	return await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_participant", (q) =>
			q.eq("hackathonId", hackathonId).eq("participantId", participantId),
		)
		.first();
}

/** The Founder's private Thread with an Applicant or Builder, created once. */
export async function ensurePrivateThread(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	participantId: Id<"users">,
): Promise<Id<"threads">> {
	const existing = await getPrivateThread(ctx, hackathon._id, participantId);
	if (existing) {
		return existing._id;
	}
	return await ctx.db.insert("threads", {
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

/** How far a Participant has got: their Cards on the Hackathon, how many are Done, and how many wait in Review. */
export async function loadParticipantProgress(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<{ done: number; inReview: number; moved: number; total: number }> {
	const cards = await loadHackathonCards(ctx, hackathonId, userId);
	return {
		done: cards.filter((card) => card.status === "done").length,
		inReview: cards.filter((card) => card.status === "review").length,
		/** Cards that left To do: none at all, 2 days in, makes a no-show. */
		moved: cards.filter((card) => card.status !== "todo").length,
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
		walkthroughRequestedAt: application.walkthroughRequestedAt ?? null,
		walkthroughAt: application.walkthroughAt ?? null,
		walkthroughNotes: application.walkthroughNotes ?? null,
		decision: application.decision ?? null,
		decisionMissed: application.decisionMissed ?? false,
		feedback: application.feedback ?? null,
		offerTerms: application.offerTerms ?? null,
		joinedAt: application.joinedAt ?? null,
	};
}

/** The open Invite that carries this application's Offer, or null once it's taken, declined or expired. */
export async function loadOfferInvite(
	ctx: Ctx,
	application: Doc<"applications">,
): Promise<Doc<"invites"> | null> {
	if (application.decision !== "hired") {
		return null;
	}
	const user = await ctx.db.get(application.userId);
	if (!user?.email) {
		return null;
	}
	const open = await loadOpenInvitesTo(ctx, normalizeEmail(user.email));
	return (
		open.find((invite) => invite.hackathonId === application.hackathonId) ??
		null
	);
}

export type OfferView = {
	state: OfferState;
	terms: string | null;
	inviteId: Id<"invites"> | null;
};

/** Where the application's Offer stands, with the Invite to answer while it's open. */
export async function loadOfferView(
	ctx: Ctx,
	application: Doc<"applications">,
): Promise<OfferView> {
	const invite = await loadOfferInvite(ctx, application);
	const state = offerState(application, invite !== null);
	return {
		state,
		terms: application.offerTerms ?? null,
		inviteId: state === "pending" && invite ? invite._id : null,
	};
}

/** What the Participant sees of their own application: the decision, the Founder's note, the Offer, and whether they've answered the promise question. */
export function toMyApplicationView(
	application: Doc<"applications">,
	offer: OfferView,
) {
	return {
		applicationId: application._id,
		status: application.status,
		decision: application.decision ?? null,
		feedback: application.feedback ?? null,
		walkthroughRequested: isWalkthroughRequested(application),
		confirmBy: application.confirmBy ?? null,
		confirmed:
			application.confirmBy === undefined ||
			application.confirmedAt !== undefined,
		offer,
		promiseAnswered: application.promiseKept !== undefined,
	};
}

/** Sends the Offer as a hire Invite carrying its terms. `"on_team"` when they're already on the startup. */
export async function sendOffer(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	application: Doc<"applications">,
	founderId: Id<"users">,
	terms: string,
): Promise<"on_team" | "invited"> {
	const participant = await ctx.db.get(application.userId);
	if (!participant?.email) {
		throw new ConvexError("This Builder has no email to invite");
	}
	const sent = await ensureHireInvite(ctx, {
		startupId: hackathon.startupId,
		userId: participant._id,
		email: participant.email,
		invitedBy: founderId,
		hackathonId: hackathon._id,
		job: hackathon.job,
		terms,
	});
	if (sent === "invited") {
		await emailUser(ctx, participant._id, {
			kind: "offer",
			...offerEmail({
				...(await hackathonNames(ctx, hackathon)),
				terms,
				expiresAt: Date.now() + INVITE_TTL_MS,
				url: `${siteUrl()}/h/${hackathon._id}`,
			}),
		});
	}
	return sent;
}

/** They accepted the Offer: Joined, once, logged on the startup's Record. */
export async function markJoined(
	ctx: MutationCtx,
	application: Doc<"applications">,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	if (application.joinedAt !== undefined) {
		return;
	}
	const now = Date.now();
	await ctx.db.patch(application._id, { joinedAt: now });
	await appendActivity(ctx, {
		startupId: hackathon.startupId,
		kind: "participant_hired",
		at: now,
		actorId: application.userId,
		hackathonId: hackathon._id,
	});
}

/** Releases a Builder who didn't confirm in time: declined, and told. */
export async function releaseIfUnconfirmed(
	ctx: MutationCtx,
	application: Doc<"applications">,
	hackathon: Doc<"hackathons">,
): Promise<boolean> {
	if (!isUnconfirmed(application, Date.now())) {
		return false;
	}
	await ctx.db.patch(application._id, { status: "declined" });
	await emailUser(ctx, application.userId, {
		kind: "place_released",
		...placeReleasedEmail({
			...(await hackathonNames(ctx, hackathon)),
			url: `${siteUrl()}/explore/hackathons`,
		}),
	});
	return true;
}

/** The person's own application, or throws. */
export async function requireOwnApplication(
	ctx: Ctx,
	applicationId: Id<"applications">,
	userId: Id<"users">,
): Promise<Doc<"applications">> {
	const application = await ctx.db.get(applicationId);
	if (!application || application.userId !== userId) {
		throw new ConvexError("This isn't your application");
	}
	return application;
}
