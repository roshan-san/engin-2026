import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { isUnderMaintenance, setMaintenance } from "../model/maintenance";

/** Whether engin is down for maintenance. The app shows the maintenance page while it's true. */
export const status = query({
	args: {},
	handler: async (ctx) => await isUnderMaintenance(ctx),
});

/**
 * Turns maintenance on or off, live for everyone. Internal, so only the Convex
 * dashboard (Functions → Run) or `pnpm exec convex run --prod site/maintenance:set '{"on": true}'` can call it.
 */
export const set = internalMutation({
	args: { on: v.boolean() },
	handler: async (ctx, args) => {
		await setMaintenance(ctx, args.on);
	},
});
