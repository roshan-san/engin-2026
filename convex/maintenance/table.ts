import { defineTable } from "convex/server";
import { v } from "convex/values";

export const maintenanceTables = {
	/**
	 * At most one row: whether engin is down for maintenance. No row means open.
	 * Flipped with `maintenance:set` from the Convex dashboard or CLI.
	 */
	maintenance: defineTable({
		on: v.boolean(),
	}),
};
