import { mutation } from "../functions";
import { requireUserId } from "../model/auth";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireUserId(ctx);

		return await ctx.storage.generateUploadUrl();
	},
});
