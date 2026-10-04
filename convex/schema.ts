import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { billingTables } from "./billing/billing.schema";
import { hiringTables } from "./hiring/hiring.schema";
import { notificationsTables } from "./people/notifications.schema";
import { peopleTables } from "./people/people.schema";
import { teamsTables } from "./teams/teams.schema";
import { workTables } from "./work/work.schema";

/**
 * Tables and their enum validators live in each domain folder as `<domain>.schema.ts`.
 *
 * Convention: `_creationTime` is used for "when was this made" everywhere.
 * Explicit timestamps only exist when they drive an indexed range query.
 */

export * from "./billing/billing.schema";
export * from "./hiring/hiring.schema";
export * from "./people/notifications.schema";
export * from "./people/people.schema";
export * from "./teams/teams.schema";
export * from "./work/work.schema";

export default defineSchema({
	...authTables,
	...peopleTables,
	...teamsTables,
	...notificationsTables,
	...workTables,
	...hiringTables,
	...billingTables,
});
