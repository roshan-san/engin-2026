import {
	customCtx,
	customMutation,
} from "convex-helpers/server/customFunctions";
import { mutation as rawMutation } from "./_generated/server";
import { requireOpen } from "./model/maintenance";

/**
 * Every public mutation is built with this instead of `_generated/server`'s, so
 * none runs while engin is down for maintenance. Internal mutations (webhooks,
 * crons, `site/maintenance:set`) don't use it and keep running. Biome enforces it.
 */
export const mutation = customMutation(
	rawMutation,
	customCtx(async (ctx) => {
		await requireOpen(ctx);
		return {};
	}),
);
