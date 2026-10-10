import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";
import { chatTables } from "./chat/chat.schema";
import { hiringTables } from "./hiring/hiring.schema";
import { peopleTables } from "./people/people.schema";
import { startupsTables } from "./startups/startups.schema";
import { workTables } from "./work/work.schema";

/**
 * Tables and their enum validators live in each domain folder as `<domain>.schema.ts`.
 *
 * Convention: `_creationTime` is used for "when was this made" everywhere.
 * Explicit timestamps only exist when they drive an indexed range query.
 */

export * from "./chat/chat.schema";
export * from "./hiring/hiring.schema";
export * from "./people/people.schema";
export * from "./startups/startups.schema";
export * from "./work/work.schema";

export default defineSchema({
	...authTables,
	...peopleTables,
	...startupsTables,
	...workTables,
	...hiringTables,
	...chatTables,
});
