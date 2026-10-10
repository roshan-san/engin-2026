import { mutation } from "../_generated/server";
import { requireUserId } from "../lib/auth";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireUserId(ctx);

		return await ctx.storage.generateUploadUrl();
	},
});
