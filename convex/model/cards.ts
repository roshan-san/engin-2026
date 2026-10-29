import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appendActivity } from "../activity/model";
import { getHackathonRole } from "../applications/model";
import { weekOf, weekStart } from "../cycles/rules";
import { loadImageUrls } from "../files/model";
import { phaseOf } from "../hackathons/rules";
import { assertUrl, limitText, requireLimitedText } from "../lib/text";
import {
	type CardAction,
	type CardActor,
	cardRefusal,
} from "../shared/cardRules";
import {
	MAX_BOARD_CARDS,
	MAX_HACKATHON_CARDS,
	MAX_PARTICIPANTS,
	MAX_SHIPPED_IMAGES,
	MAX_SHIPPED_LINKS,
	TEXT,
} from "../shared/limits";
import { getTeamRole, requireTeam } from "../startups/team";
import { loadPublicUser } from "../users/model";

type Ctx = QueryCtx | MutationCtx;

export type Shipped = NonNullable<Doc<"cards">["shipped"]>;

/**
 * The one access path to a Card: who is acting on it, for `cardRefusal` to rule on.
 * Startup Cards belong to the team. Hackathon Cards (`hackathonId` set) to the
 * Founder and the Participant who owns them; nobody else, Contributors included.
 * Template Cards are nobody's to work.
 */
export async function requireCardAccess(
	ctx: Ctx,
	cardId: Id<"cards">,
	userId: Id<"users">,
): Promise<{
	card: Doc<"cards">;
	startup: Doc<"startups">;
	actor: CardActor;
}> {
	const card = await ctx.db.get(cardId);
	if (!card) {
		throw new ConvexError("This Card doesn't exist");
	}
	if (!card.hackathonId) {
		const { startup, role } = await requireTeam(ctx, card.startupId, userId);
		return { card, startup, actor: { userId, role, phase: null } };
	}
	const [hackathon, startup] = await Promise.all([
		ctx.db.get(card.hackathonId),
		ctx.db.get(card.startupId),
	]);
	if (!hackathon || !startup) {
		throw new ConvexError("This Card doesn't exist");
	}
	const role = await getHackathonRole(ctx, startup, hackathon._id, userId);
	// An ownerless Hackathon Card is a template: the draft's brief, changed only by `hackathons.update`.
	if (role === "founder" && !card.ownerId) {
		throw new ConvexError("Template Cards change in the Hackathon's post");
	}
	if (
		role === "founder" ||
		(role === "participant" && card.ownerId === userId)
	) {
		const phase = phaseOf(hackathon, Date.now());
		return { card, startup, actor: { userId, role, phase } };
	}
	throw new ConvexError("This Card isn't yours");
}

/** Throws `cardRefusal`'s reason when `actor` may not do `action` to `card`. */
export function requireAllowed(
	card: Doc<"cards">,
	action: CardAction,
	actor: CardActor,
): void {
	const refusal = cardRefusal(card, action, actor);
	if (refusal) {
		throw new ConvexError(refusal);
	}
}

/** Who may see a Participant's Cards: the Founder, or that Participant. */
export async function requireParticipantBoardAccess(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
	participantId: Id<"users">,
	userId: Id<"users">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	const startup = hackathon && (await ctx.db.get(hackathon.startupId));
	if (!startup) {
		throw new ConvexError("This Hackathon doesn't exist");
	}
	const role = await getHackathonRole(ctx, startup, hackathonId, userId);
	if (
		role !== "founder" &&
		!(role === "participant" && participantId === userId)
	) {
		throw new ConvexError("This Card isn't yours");
	}
}

/** A Card the Founder sent back: it is back in play but still carries its last submission. */
export function isChangesAsked(card: Doc<"cards">): boolean {
	return (
		(card.status === "todo" || card.status === "in_progress") &&
		card.submittedAt !== undefined
	);
}

/** The owner has to be on the Startup's team. */
export async function requireTeamOwner(
	ctx: Ctx,
	startupId: Id<"startups">,
	ownerId: Id<"users">,
): Promise<void> {
	if (!(await getTeamRole(ctx, startupId, ownerId))) {
		throw new ConvexError("They're not on this Startup's team");
	}
}

export function normalizeTitle(title: string): string {
	return requireLimitedText(title, "Title", TEXT.cardTitle);
}

export function normalizeNotes(notes: string): string {
	return limitText(notes, "Notes", TEXT.notes) ?? "";
}

/** Validates What shipped: a line, http(s) links and images, with at least one link or image. */
export function parseShipped(input: Shipped): Shipped {
	const line = input.line.trim();
	if (!line) {
		throw new ConvexError("Say what shipped");
	}
	if (line.length > TEXT.shippedLine) {
		throw new ConvexError(`Say it in under ${TEXT.shippedLine} characters`);
	}
	if (input.links.length > MAX_SHIPPED_LINKS) {
		throw new ConvexError(`Add up to ${MAX_SHIPPED_LINKS} links`);
	}
	if (input.images.length > MAX_SHIPPED_IMAGES) {
		throw new ConvexError(`Add up to ${MAX_SHIPPED_IMAGES} images`);
	}
	const links = input.links.map((link) => assertUrl(link, "Links") ?? "");
	if (links.some((link) => !link)) {
		throw new ConvexError("Links must start with http:// or https://");
	}
	if (links.length === 0 && input.images.length === 0) {
		throw new ConvexError("Add a link or an image");
	}
	return { line, links, images: input.images };
}

/** Open Cards, plus the Cards verified this Cycle, newest first within each column. */
export async function loadBoardCards(
	ctx: Ctx,
	startupId: Id<"startups">,
	now: number,
): Promise<Doc<"cards">[]> {
	const open = (status: "todo" | "in_progress" | "review") =>
		ctx.db
			.query("cards")
			.withIndex("by_startup_and_hackathon_and_status_and_verifiedAt", (q) =>
				q
					.eq("startupId", startupId)
					.eq("hackathonId", undefined)
					.eq("status", status),
			)
			.order("desc")
			.take(MAX_BOARD_CARDS);
	const thisWeek = weekStart(weekOf(now));
	const verifiedThisWeek = ctx.db
		.query("cards")
		.withIndex("by_startup_and_hackathon_and_status_and_verifiedAt", (q) =>
			q
				.eq("startupId", startupId)
				.eq("hackathonId", undefined)
				.eq("status", "done")
				.gte("verifiedAt", thisWeek),
		)
		.order("desc")
		.take(MAX_BOARD_CARDS);

	const [todo, inProgress, review, done] = await Promise.all([
		open("todo"),
		open("in_progress"),
		open("review"),
		verifiedThisWeek,
	]);
	return [...todo, ...inProgress, ...review, ...done];
}

/** Participants' Cards waiting in Review on the Hackathon. */
export async function loadHackathonCardsInReview(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"cards">[]> {
	const inReview = await ctx.db
		.query("cards")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "review"),
		)
		.take(MAX_PARTICIPANTS * MAX_HACKATHON_CARDS);
	return inReview.filter((card) => card.ownerId !== undefined);
}

export type CardView = Awaited<ReturnType<typeof toCardView>>;

export async function toCardView(ctx: Ctx, card: Doc<"cards">) {
	const [owner, notesEditedBy, verifiedBy, imageUrls] = await Promise.all([
		loadPublicUser(ctx, card.ownerId),
		loadPublicUser(ctx, card.notesEditedBy),
		loadPublicUser(ctx, card.verifiedBy),
		loadImageUrls(ctx, card.shipped?.images ?? []),
	]);
	return {
		_id: card._id,
		title: card.title,
		notes: card.notes,
		status: card.status,
		owner,
		shipped: card.shipped ? { ...card.shipped, imageUrls } : null,
		submittedAt: card.submittedAt ?? null,
		verifiedAt: card.verifiedAt ?? null,
		verifiedBy,
		notesEditedAt: card.notesEditedAt ?? null,
		notesEditedBy,
		changesAsked: isChangesAsked(card),
		selfVerified:
			card.status === "done" &&
			card.ownerId !== undefined &&
			card.verifiedBy === card.ownerId,
	};
}

/** Moves a Card to Done, locking its What shipped, and logs it on the Startup's Activity. The owner verifying their own Card is self-verified. */
export async function markVerified(
	ctx: MutationCtx,
	card: Doc<"cards">,
	shipped: Shipped,
	verifierId: Id<"users">,
	now: number,
): Promise<void> {
	await ctx.db.patch(card._id, {
		status: "done",
		shipped,
		verifiedAt: now,
		verifiedBy: verifierId,
	});
	// Hackathon work is the Participant's, not the Startup's: it stays off the Activity.
	if (card.hackathonId) {
		return;
	}
	await appendActivity(ctx, {
		startupId: card.startupId,
		kind: "card_verified",
		at: now,
		actorId: card.ownerId,
		cardId: card._id,
		line: shipped.line,
		selfVerified: verifierId === card.ownerId,
	});
}
