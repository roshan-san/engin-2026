import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx | ActionCtx;

export async function requireUserId(ctx: AuthCtx): Promise<Id<"users">> {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new ConvexError("Not authenticated");
	}
	return userId;
}
