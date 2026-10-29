import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { loadHackathonPlaces, startupReasons } from "./places/model";
import { MAX_USER_STARTUPS } from "./shared/limits";
import { loadFoundedStartups, loadLogoUrl } from "./startups/model";

/** Every place the person can switch to, each with what is waiting on them. */
export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const [founded, contributions] = await Promise.all([
			loadFoundedStartups(ctx, userId),
			ctx.db
				.query("contributors")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.take(MAX_USER_STARTUPS),
		]);
		const contributed = (
			await Promise.all(
				contributions.map((contribution) => ctx.db.get(contribution.startupId)),
			)
		).filter((startup) => startup !== null);

		const [startups, { hackathons, applied }] = await Promise.all([
			Promise.all(
				[
					...founded.map((startup) => ({ startup, role: "founder" as const })),
					...contributed.map((startup) => ({
						startup,
						role: "contributor" as const,
					})),
				].map(async ({ startup, role }) => ({
					startupId: startup._id,
					slug: startup.slug,
					name: startup.name,
					role,
					logoUrl: await loadLogoUrl(ctx, startup),
					rating: startup.rating,
					waiting: await startupReasons(
						ctx,
						startup._id,
						userId,
						role === "founder",
					),
				})),
			),
			loadHackathonPlaces(ctx, userId),
		]);

		return { startups, hackathons, applied };
	},
});
