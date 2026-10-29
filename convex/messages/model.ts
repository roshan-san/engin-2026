import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { loadImageUrls } from "../files/model";
import { limitText } from "../lib/text";
import { loadPublicUser, type PublicUser } from "../users/model";
import {
	MAX_MESSAGE_IMAGES,
	MAX_MESSAGE_MENTIONS,
	MAX_MESSAGES,
	MESSAGE_TEXT,
	parseMentions,
} from "./rules";

/** A trimmed message that has text, images, or both. */
export function parseMessage(
	body: string,
	images: Id<"_storage">[] | undefined,
): { body: string; images: Id<"_storage">[] } {
	const text = limitText(body, "Message", MESSAGE_TEXT.body) ?? "";
	const attached = images ?? [];
	if (attached.length > MAX_MESSAGE_IMAGES) {
		throw new ConvexError(`Add up to ${MAX_MESSAGE_IMAGES} images`);
	}
	if (!text && attached.length === 0) {
		throw new ConvexError("Write something or add an image");
	}
	return { body: text, images: attached };
}

/** The latest messages in a thread, oldest first. */
export async function loadLatestMessages(
	ctx: QueryCtx,
	threadId: Id<"threads">,
): Promise<Doc<"messages">[]> {
	const latest = await ctx.db
		.query("messages")
		.withIndex("by_thread", (q) => q.eq("threadId", threadId))
		.order("desc")
		.take(MAX_MESSAGES);
	return latest.reverse();
}

/** A thread's pinned messages, oldest first. */
export async function loadPinnedMessages(
	ctx: QueryCtx,
	threadId: Id<"threads">,
): Promise<Doc<"messages">[]> {
	return await ctx.db
		.query("messages")
		.withIndex("by_thread_and_pinned", (q) =>
			q.eq("threadId", threadId).eq("pinned", true),
		)
		.take(MAX_MESSAGES);
}

/**
 * The Startup Cards a message mentions, with titles. Ids that aren't Cards,
 * removed Cards, other Startups' Cards, Hackathon Cards and any mention outside
 * a Team thread stay plain text.
 */
async function loadMentionedCards(
	ctx: QueryCtx,
	thread: Doc<"threads">,
	body: string,
): Promise<{ cardId: Id<"cards">; title: string }[]> {
	// Only the team shares a Board; elsewhere a token stays plain text.
	if (thread.kind !== "team") {
		return [];
	}
	const mentions = await Promise.all(
		parseMentions(body)
			.slice(0, MAX_MESSAGE_MENTIONS)
			.map(async (id) => {
				const cardId = ctx.db.normalizeId("cards", id);
				const card = cardId ? await ctx.db.get(cardId) : null;
				return card && card.startupId === thread.startupId && !card.hackathonId
					? [{ cardId: card._id, title: card.title }]
					: [];
			}),
	);
	return mentions.flat();
}

export async function buildMessageViews(
	ctx: QueryCtx,
	thread: Doc<"threads">,
	messages: Doc<"messages">[],
) {
	// One read per author, however many messages they wrote.
	const authors = new Map<Id<"users">, Promise<PublicUser | null>>();
	const authorOf = (authorId: Id<"users">) => {
		let author = authors.get(authorId);
		if (!author) {
			author = loadPublicUser(ctx, authorId);
			authors.set(authorId, author);
		}
		return author;
	};

	const views = await Promise.all(
		messages.map(async (message) => {
			const [author, mentions, imageUrls] = await Promise.all([
				authorOf(message.authorId),
				loadMentionedCards(ctx, thread, message.body),
				loadImageUrls(ctx, message.images),
			]);
			return author
				? [
						{
							_id: message._id,
							author,
							body: message.body,
							mentions,
							imageUrls,
							pinned: message.pinned,
							at: message._creationTime,
						},
					]
				: [];
		}),
	);
	return views.flat();
}
