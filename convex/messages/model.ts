import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { threadMessageEmail } from "../email/copy";
import { emailUser, hackathonNames } from "../email/model";
import { siteUrl } from "../email/rules";
import { loadImageUrls } from "../files/model";
import { limitText } from "../lib/text";
import { loadFounderIds } from "../startups/team";
import { markThreadRead } from "../threads/model";
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

/** Posts a message and marks the thread read by its author. The caller checks access. */
export async function postMessage(
	ctx: MutationCtx,
	threadId: Id<"threads">,
	authorId: Id<"users">,
	message: { body: string; images: Id<"_storage">[] },
): Promise<void> {
	await ctx.db.insert("messages", {
		threadId,
		authorId,
		body: message.body,
		images: message.images,
		pinned: false,
	});
	await ctx.db.patch(threadId, { lastMessageAt: Date.now() });
	await markThreadRead(ctx, threadId, authorId);
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

/**
 * After a Hackathon is done, nobody watches its space, so a private message also goes
 * by email to the other person: the Builder's to the Founder, the Founder's to the Builder.
 */
export async function emailLateMessage(
	ctx: MutationCtx,
	thread: Doc<"threads">,
	authorId: Id<"users">,
	body: string,
): Promise<void> {
	if (
		thread.kind !== "private" ||
		!thread.hackathonId ||
		!thread.participantId
	) {
		return;
	}
	const hackathon = await ctx.db.get(thread.hackathonId);
	const startup = await ctx.db.get(thread.startupId);
	if (hackathon?.status !== "done" || !startup) {
		return;
	}
	const founderIds = await loadFounderIds(ctx, startup);
	const toFounder = !founderIds.includes(authorId);
	const recipients = (toFounder ? founderIds : [thread.participantId]).filter(
		(id) => id !== authorId,
	);
	const author = await ctx.db.get(authorId);
	const email = threadMessageEmail({
		...(await hackathonNames(ctx, hackathon)),
		fromName: author?.name ?? "Someone",
		body: body || "(an image)",
		url: toFounder
			? `${siteUrl()}/s/${startup.slug}/hiring/${hackathon._id}`
			: `${siteUrl()}/h/${hackathon._id}?panel=founder`,
	});
	for (const recipient of recipients) {
		await emailUser(ctx, recipient, { kind: "thread_message", ...email });
	}
}
