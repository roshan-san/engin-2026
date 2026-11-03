import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** The unsubscribe link: opts its address out of every engin email. False for an unknown token. */
export const unsubscribe = internalMutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const prefs = await ctx.db
			.query("emailPrefs")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();
		if (!prefs) {
			return false;
		}
		await ctx.db.patch(prefs._id, { optedOut: true });
		return true;
	},
});
