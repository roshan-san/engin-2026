import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

/**
 * State the browser tests need but no endpoint can reach in real time.
 * Everything else is arranged through the public API, as a signed-in person.
 * Run only through `convex run`, and only where E2E=1.
 */
function requireE2E() {
	if (process.env.E2E !== "1") {
		throw new Error("E2E seeding is off on this deployment");
	}
}

/** Starts a published Trial Cycle now instead of at its scheduled start. */
export const startTrial = internalMutation({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		requireE2E();
		await ctx.runMutation(internal.hiring.trialCycles.start, args);
	},
});

/** One unspent hackathon credit, as if the person had paid. */
export const giveCredit = internalMutation({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		requireE2E();
		const user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.unique();
		if (!user) {
			throw new Error(`No user with email ${args.email}`);
		}
		await ctx.db.insert("hackathonCredits", {
			ownerUserId: user._id,
			source: "purchase",
		});
	},
});
