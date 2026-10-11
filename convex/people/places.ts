import { query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_USER_APPLICATIONS, MAX_USER_STARTUPS } from "../lib/limits";
import {
	builderWaiting,
	loadBuilderSignals,
	loadStartupSignals,
	startupWaiting,
} from "./places.rules";

/** Every place the person can switch to, each with whether it's waiting on them. */
export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const founded = await ctx.db
			.query("startups")
			.withIndex("by_founder", (q) => q.eq("founderId", userId))
			.take(MAX_USER_STARTUPS);
		const contributions = await ctx.db
			.query("contributors")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(MAX_USER_STARTUPS);
		const contributed = (
			await Promise.all(
				contributions.map((contribution) => ctx.db.get(contribution.startupId)),
			)
		).filter((startup) => startup !== null);

		const startups = await Promise.all(
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
				waiting: startupWaiting(
					await loadStartupSignals(
						ctx,
						startup._id,
						userId,
						role === "founder",
					),
				),
			})),
		);

		const applications = await ctx.db
			.query("applications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(MAX_USER_APPLICATIONS);

		const building = [];
		const applied = [];
		for (const application of applications) {
			const hackathon = await ctx.db.get(application.hackathonId);
			const startup = hackathon && (await ctx.db.get(hackathon.startupId));
			if (!hackathon || !startup) {
				continue;
			}
			const place = {
				hackathonId: hackathon._id,
				job: hackathon.job,
				startupName: startup.name,
			};

			if (application.status === "building") {
				const signals = await loadBuilderSignals(ctx, application);
				// A finished Hackathon stays until the promise question is answered.
				if (hackathon.status !== "done" || signals.promisePending) {
					building.push({ ...place, waiting: builderWaiting(signals) });
				}
			} else if (
				(application.status === "applied" ||
					application.status === "declined") &&
				hackathon.status !== "done"
			) {
				applied.push({ ...place, status: application.status });
			}
		}

		return { startups, building, applied };
	},
});
