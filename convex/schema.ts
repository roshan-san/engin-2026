import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { billingTables } from "./billing/table";
import { maintenanceTables } from "./maintenance/table";
import { chatTables } from "./tables/chat";
import { hiringTables } from "./tables/hiring";
import { peopleTables } from "./tables/people";
import { startupsTables } from "./tables/startups";
import { workTables } from "./tables/work";

/**
 * Tables live in convex/tables/<domain>.ts; their enum validators in convex/shared/validators.ts.
 *
 * Convention: `_creationTime` is used for "when was this made" everywhere.
 * Explicit timestamps only exist when they drive an indexed range query.
 */

export default defineSchema({
	...authTables,
	...peopleTables,
	...startupsTables,
	...workTables,
	...hiringTables,
	...chatTables,
	...billingTables,
	...maintenanceTables,
});
