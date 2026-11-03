import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import type { DataModel, Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const migrations = new Migrations<DataModel>(components.migrations);

/** Runs migrations from the CLI: `npx convex run migrations:run '{"fn":"migrations:setJoinedAt"}'`. */
export const run = migrations.runner();

/**
 * Before Offers, a hire was `decision: "hired"`, and accepting its Invite only added a
 * contributor row. A hire on the team has joined, so they get `joinedAt` from that row.
 */
export async function joinedAtFor(
	ctx: MutationCtx,
	application: Doc<"applications">,
): Promise<void> {
	if (application.decision !== "hired" || application.joinedAt !== undefined) {
		return;
	}
	const hackathon = await ctx.db.get(application.hackathonId);
	if (!hackathon) {
		return;
	}
	const contributor = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) =>
			q.eq("startupId", hackathon.startupId).eq("userId", application.userId),
		)
		.unique();
	if (contributor) {
		await ctx.db.patch(application._id, {
			joinedAt: contributor._creationTime,
		});
	}
}

export const setJoinedAt = migrations.define({
	table: "applications",
	migrateOne: joinedAtFor,
});
