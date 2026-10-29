import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { activityTables } from "./activity/table";
import { billingTables } from "./billing/table";
import { contributorsTables } from "./contributors/table";
import { cyclesTables } from "./cycles/table";
import { hackathonsTables } from "./hackathons/table";
import { invitesTables } from "./invites/table";
import { maintenanceTables } from "./maintenance/table";
import { startupsTables } from "./startups/table";
import { chatTables } from "./tables/chat";
import { hiringTables } from "./tables/hiring";
import { workTables } from "./tables/work";
import { usersTables } from "./users/table";

/**
 * Tables live in convex/tables/<domain>.ts; their enum validators in convex/shared/validators.ts.
 *
 * Convention: `_creationTime` is used for "when was this made" everywhere.
 * Explicit timestamps only exist when they drive an indexed range query.
 */

export default defineSchema({
	...authTables,
	...usersTables,
	...startupsTables,
	...contributorsTables,
	...invitesTables,
	...workTables,
	...activityTables,
	...cyclesTables,
	...hackathonsTables,
	...hiringTables,
	...chatTables,
	...billingTables,
	...maintenanceTables,
});
