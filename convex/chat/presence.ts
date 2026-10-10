import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { toPublicUser } from "../people/users.rules";
import { requireTeam } from "../startups/access.rules";
import { loadWorkingOn, presence } from "./presence.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTeam(ctx, args.startupId, userId);

		const online = await presence.listRoom(ctx, args.startupId, true);
		const workingOn = await loadWorkingOn(ctx, args.startupId);
		const people = await Promise.all(
			online.map((entry) => ctx.db.get(entry.userId as Id<"users">)),
		);
		return people.flatMap((person) =>
			person
				? [
						{
							user: toPublicUser(person),
							workingOn: workingOn.get(person._id) ?? null,
						},
					]
				: [],
		);
	},
});

export const heartbeat = mutation({
	args: {
		startupId: v.id("startups"),
		sessionId: v.string(),
		interval: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTeam(ctx, args.startupId, userId);

		return await presence.heartbeat(
			ctx,
			args.startupId,
			userId,
			args.sessionId,
			args.interval,
		);
	},
});

export const disconnect = mutation({
	args: { sessionToken: v.string() },
	handler: async (ctx, args) => {
		// The session token is the credential, so there is no team guard.
		return await presence.disconnect(ctx, args.sessionToken);
	},
});
