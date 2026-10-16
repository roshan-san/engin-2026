import { query } from "../_generated/server";
import { requireUserId } from "../model/auth";
import {
	isPromisePending,
	participantReasons,
	startupReasons,
} from "../model/places";
import { MAX_USER_APPLICATIONS, MAX_USER_STARTUPS } from "../shared/limits";

/** Every place the person can switch to, each with what is waiting on them. */
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
				logoUrl: startup.logo ? await ctx.storage.getUrl(startup.logo) : null,
				rating: startup.rating,
				waiting: await startupReasons(
					ctx,
					startup._id,
					userId,
					role === "founder",
				),
			})),
		);

		const applications = await ctx.db
			.query("applications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(MAX_USER_APPLICATIONS);

		const hackathons = [];
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
				startupSlug: startup.slug,
				startupLogoUrl: startup.logo
					? await ctx.storage.getUrl(startup.logo)
					: null,
			};

			if (application.status === "participating") {
				// A finished Hackathon stays until the promise question is answered.
				if (hackathon.status !== "done" || isPromisePending(application)) {
					hackathons.push({
						...place,
						status: hackathon.status,
						startsAt: hackathon.startsAt,
						endsAt: hackathon.endsAt,
						decision: application.decision ?? null,
						waiting: await participantReasons(ctx, application),
					});
				}
			} else if (
				(application.status === "applied" ||
					application.status === "declined") &&
				hackathon.status !== "done"
			) {
				applied.push({ ...place, status: application.status });
			}
		}

		return { startups, hackathons, applied };
	},
});
