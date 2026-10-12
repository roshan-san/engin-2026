/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as chat_messages from "../chat/messages.js";
import type * as chat_presence from "../chat/presence.js";
import type * as chat_threads from "../chat/threads.js";
import type * as crons from "../crons.js";
import type * as dev_reset from "../dev/reset.js";
import type * as files_files from "../files/files.js";
import type * as hiring_applications from "../hiring/applications.js";
import type * as hiring_hackathons from "../hiring/hackathons.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_text from "../lib/text.js";
import type * as people_places from "../people/places.js";
import type * as people_users from "../people/users.js";
import type * as shared_cycles from "../shared/cycles.js";
import type * as shared_limits from "../shared/limits.js";
import type * as shared_mentions from "../shared/mentions.js";
import type * as shared_validators from "../shared/validators.js";
import type * as startups_contributors from "../startups/contributors.js";
import type * as startups_invites from "../startups/invites.js";
import type * as startups_startups from "../startups/startups.js";
import type * as work_activity from "../work/activity.js";
import type * as work_cards from "../work/cards.js";
import type * as work_cycles from "../work/cycles.js";
import type * as work_rating from "../work/rating.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "chat/messages": typeof chat_messages;
  "chat/presence": typeof chat_presence;
  "chat/threads": typeof chat_threads;
  crons: typeof crons;
  "dev/reset": typeof dev_reset;
  "files/files": typeof files_files;
  "hiring/applications": typeof hiring_applications;
  "hiring/hackathons": typeof hiring_hackathons;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/text": typeof lib_text;
  "people/places": typeof people_places;
  "people/users": typeof people_users;
  "shared/cycles": typeof shared_cycles;
  "shared/limits": typeof shared_limits;
  "shared/mentions": typeof shared_mentions;
  "shared/validators": typeof shared_validators;
  "startups/contributors": typeof startups_contributors;
  "startups/invites": typeof startups_invites;
  "startups/startups": typeof startups_startups;
  "work/activity": typeof work_activity;
  "work/cards": typeof work_cards;
  "work/cycles": typeof work_cycles;
  "work/rating": typeof work_rating;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
