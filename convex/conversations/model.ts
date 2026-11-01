import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { loadPublicUser, type PublicUser } from "../users/model";
import { MAX_WEEK_CONVERSATIONS } from "./rules";

export type ConversationView = {
	_id: Id<"conversations">;
	line: string;
	authorId: Id<"users">;
	author: PublicUser | null;
};

/** The week's rows, newest first. */
export async function loadConversationRows(
	ctx: QueryCtx | MutationCtx,
	startupId: Id<"startups">,
	week: string,
) {
	return await ctx.db
		.query("conversations")
		.withIndex("by_startup_and_week", (q) =>
			q.eq("startupId", startupId).eq("week", week),
		)
		.order("desc")
		.take(MAX_WEEK_CONVERSATIONS);
}

/** The week's lines with who wrote them, newest first. */
export async function loadConversations(
	ctx: QueryCtx | MutationCtx,
	startupId: Id<"startups">,
	week: string,
): Promise<ConversationView[]> {
	const rows = await loadConversationRows(ctx, startupId, week);
	return await Promise.all(
		rows.map(async (row) => ({
			_id: row._id,
			line: row.line,
			authorId: row.authorId,
			author: await loadPublicUser(ctx, row.authorId),
		})),
	);
}
