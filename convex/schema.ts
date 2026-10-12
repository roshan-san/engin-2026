import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { chatTables } from "./chat/chat.schema";
import { hiringTables } from "./hiring/hiring.schema";
import { peopleTables } from "./people/people.schema";
import { startupsTables } from "./startups/startups.schema";
import { workTables } from "./work/work.schema";

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
});
