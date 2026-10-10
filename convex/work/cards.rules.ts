import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_BOARD_CARDS,
	MAX_SHIPPED_IMAGES,
	MAX_SHIPPED_LINKS,
	TEXT,
} from "../lib/limits";
import { assertUrl, requireLimitedText } from "../lib/text";
import { loadPublicUser } from "../people/users.rules";
import {
	getTeamRole,
	requireTeam,
	type TeamRole,
} from "../startups/access.rules";
import { appendActivity } from "./activity.rules";
import { weekOf, weekStart } from "./cycles.rules";

type Ctx = QueryCtx | MutationCtx;

export type CardRole = TeamRole | "builder";

export type Shipped = NonNullable<Doc<"cards">["shipped"]>;

/**
 * The one access path to a Card. Startup Cards belong to the team.
 * Hackathon Cards (`hackathonId` set) get their own branch with the Hackathon work.
 */
export async function requireCardAccess(
	ctx: Ctx,
	cardId: Id<"cards">,
	userId: Id<"users">,
): Promise<{
	card: Doc<"cards">;
	startup: Doc<"startups">;
	role: CardRole;
}> {
	const card = await ctx.db.get(cardId);
	if (!card) {
		throw new Error("This Card doesn't exist");
	}
	if (card.hackathonId) {
		throw new Error("This Card isn't yours");
	}
	const { startup, role } = await requireTeam(ctx, card.startupId, userId);
	return { card, startup, role };
}

/** A Card the Founder sent back: it is back in play but still carries its last submission. */
export function isChangesAsked(card: Doc<"cards">): boolean {
	return (
		(card.status === "todo" || card.status === "in_progress") &&
		card.submittedAt !== undefined
	);
}

export function requireNotVerified(card: Doc<"cards">): void {
	if (card.status === "done") {
		throw new Error("This Card is verified");
	}
}

/** The owner has to be on the Startup's team. */
export async function requireTeamOwner(
	ctx: Ctx,
	startupId: Id<"startups">,
	ownerId: Id<"users">,
): Promise<void> {
	if (!(await getTeamRole(ctx, startupId, ownerId))) {
		throw new Error("They're not on this startup");
	}
}

export function normalizeTitle(title: string): string {
	return requireLimitedText(title, "Title", TEXT.cardTitle);
}

export function normalizeNotes(notes: string): string {
	const trimmed = notes.trim();
	if (trimmed.length > TEXT.notes) {
		throw new Error(`Notes must be under ${TEXT.notes} characters`);
	}
	return trimmed;
}

/** Validates What shipped: a line, http(s) links and images, with at least one link or image. */
export function parseShipped(input: Shipped): Shipped {
	const line = input.line.trim();
	if (!line) {
		throw new Error("Say what shipped");
	}
	if (line.length > TEXT.shippedLine) {
		throw new Error(`Say it in under ${TEXT.shippedLine} characters`);
	}
	if (input.links.length > MAX_SHIPPED_LINKS) {
		throw new Error(`Add up to ${MAX_SHIPPED_LINKS} links`);
	}
	if (input.images.length > MAX_SHIPPED_IMAGES) {
		throw new Error(`Add up to ${MAX_SHIPPED_IMAGES} images`);
	}
	const links = input.links.map((link) => assertUrl(link, "Links") ?? "");
	if (links.some((link) => !link)) {
		throw new Error("Links must start with http:// or https://");
	}
	if (links.length === 0 && input.images.length === 0) {
		throw new Error("Add a link or image");
	}
	return { line, links, images: input.images };
}

/** Open Cards, plus the Cards verified this Cycle, newest first within each column. */
export async function loadBoardCards(
	ctx: Ctx,
	startupId: Id<"startups">,
	now: number,
): Promise<Doc<"cards">[]> {
	const byStatus = (status: Doc<"cards">["status"]) =>
		ctx.db
			.query("cards")
			.withIndex("by_startup_and_status", (q) =>
				q
					.eq("startupId", startupId)
					.eq("hackathonId", undefined)
					.eq("status", status),
			)
			.order("desc")
			.take(MAX_BOARD_CARDS);

	const [todo, inProgress, review, done] = await Promise.all([
		byStatus("todo"),
		byStatus("in_progress"),
		byStatus("review"),
		byStatus("done"),
	]);
	const thisWeek = weekStart(weekOf(now));
	return [
		...todo,
		...inProgress,
		...review,
		...done.filter((card) => (card.verifiedAt ?? 0) >= thisWeek),
	];
}

export async function toCardView(ctx: Ctx, card: Doc<"cards">) {
	const [owner, notesEditedBy] = await Promise.all([
		loadPublicUser(ctx, card.ownerId),
		loadPublicUser(ctx, card.notesEditedBy),
	]);
	return {
		_id: card._id,
		title: card.title,
		notes: card.notes,
		status: card.status,
		owner,
		shipped: card.shipped ?? null,
		notesEditedAt: card.notesEditedAt ?? null,
		notesEditedBy,
		changesAsked: isChangesAsked(card),
		selfVerified:
			card.status === "done" &&
			card.ownerId !== undefined &&
			card.verifiedBy === card.ownerId,
	};
}

/** Moves a Card to Done, locking its What shipped, and logs it. The owner verifying their own Card is self-verified. */
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
