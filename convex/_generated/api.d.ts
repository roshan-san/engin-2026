/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as activity_model from "../activity/model.js";
import type * as activity_table from "../activity/table.js";
import type * as applications from "../applications.js";
import type * as applications_model from "../applications/model.js";
import type * as applications_rules from "../applications/rules.js";
import type * as applications_table from "../applications/table.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as billing_dodo from "../billing/dodo.js";
import type * as billing_model from "../billing/model.js";
import type * as billing_rules from "../billing/rules.js";
import type * as billing_table from "../billing/table.js";
import type * as cards from "../cards.js";
import type * as cards_model from "../cards/model.js";
import type * as cards_rules from "../cards/rules.js";
import type * as cards_table from "../cards/table.js";
import type * as contributors from "../contributors.js";
import type * as contributors_model from "../contributors/model.js";
import type * as contributors_table from "../contributors/table.js";
import type * as crons from "../crons.js";
import type * as cycles from "../cycles.js";
import type * as cycles_model from "../cycles/model.js";
import type * as cycles_rules from "../cycles/rules.js";
import type * as cycles_table from "../cycles/table.js";
import type * as files from "../files.js";
import type * as files_model from "../files/model.js";
import type * as hackathons from "../hackathons.js";
import type * as hackathons_lifecycle from "../hackathons/lifecycle.js";
import type * as hackathons_model from "../hackathons/model.js";
import type * as hackathons_record from "../hackathons/record.js";
import type * as hackathons_rules from "../hackathons/rules.js";
import type * as hackathons_table from "../hackathons/table.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as invites_model from "../invites/model.js";
import type * as invites_table from "../invites/table.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_returnPath from "../lib/returnPath.js";
import type * as lib_text from "../lib/text.js";
import type * as maintenance from "../maintenance.js";
import type * as maintenance_model from "../maintenance/model.js";
import type * as maintenance_table from "../maintenance/table.js";
import type * as messages from "../messages.js";
import type * as messages_model from "../messages/model.js";
import type * as messages_rules from "../messages/rules.js";
import type * as messages_table from "../messages/table.js";
import type * as model_places from "../model/places.js";
import type * as people_places from "../people/places.js";
import type * as presence from "../presence.js";
import type * as presence_model from "../presence/model.js";
import type * as rating from "../rating.js";
import type * as rating_model from "../rating/model.js";
import type * as rating_rules from "../rating/rules.js";
import type * as shared_limits from "../shared/limits.js";
import type * as shared_places from "../shared/places.js";
import type * as shared_validators from "../shared/validators.js";
import type * as startups from "../startups.js";
import type * as startups_model from "../startups/model.js";
import type * as startups_table from "../startups/table.js";
import type * as startups_team from "../startups/team.js";
import type * as threads from "../threads.js";
import type * as threads_access from "../threads/access.js";
import type * as threads_model from "../threads/model.js";
import type * as threads_table from "../threads/table.js";
import type * as users from "../users.js";
import type * as users_model from "../users/model.js";
import type * as users_rules from "../users/rules.js";
import type * as users_table from "../users/table.js";
import type * as users_username from "../users/username.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  "activity/model": typeof activity_model;
  "activity/table": typeof activity_table;
  applications: typeof applications;
  "applications/model": typeof applications_model;
  "applications/rules": typeof applications_rules;
  "applications/table": typeof applications_table;
  auth: typeof auth;
  billing: typeof billing;
  "billing/dodo": typeof billing_dodo;
  "billing/model": typeof billing_model;
  "billing/rules": typeof billing_rules;
  "billing/table": typeof billing_table;
  cards: typeof cards;
  "cards/model": typeof cards_model;
  "cards/rules": typeof cards_rules;
  "cards/table": typeof cards_table;
  contributors: typeof contributors;
  "contributors/model": typeof contributors_model;
  "contributors/table": typeof contributors_table;
  crons: typeof crons;
  cycles: typeof cycles;
  "cycles/model": typeof cycles_model;
  "cycles/rules": typeof cycles_rules;
  "cycles/table": typeof cycles_table;
  files: typeof files;
  "files/model": typeof files_model;
  hackathons: typeof hackathons;
  "hackathons/lifecycle": typeof hackathons_lifecycle;
  "hackathons/model": typeof hackathons_model;
  "hackathons/record": typeof hackathons_record;
  "hackathons/rules": typeof hackathons_rules;
  "hackathons/table": typeof hackathons_table;
  http: typeof http;
  invites: typeof invites;
  "invites/model": typeof invites_model;
  "invites/table": typeof invites_table;
  "lib/auth": typeof lib_auth;
  "lib/returnPath": typeof lib_returnPath;
  "lib/text": typeof lib_text;
  maintenance: typeof maintenance;
  "maintenance/model": typeof maintenance_model;
  "maintenance/table": typeof maintenance_table;
  messages: typeof messages;
  "messages/model": typeof messages_model;
  "messages/rules": typeof messages_rules;
  "messages/table": typeof messages_table;
  "model/places": typeof model_places;
  "people/places": typeof people_places;
  presence: typeof presence;
  "presence/model": typeof presence_model;
  rating: typeof rating;
  "rating/model": typeof rating_model;
  "rating/rules": typeof rating_rules;
  "shared/limits": typeof shared_limits;
  "shared/places": typeof shared_places;
  "shared/validators": typeof shared_validators;
  startups: typeof startups;
  "startups/model": typeof startups_model;
  "startups/table": typeof startups_table;
  "startups/team": typeof startups_team;
  threads: typeof threads;
  "threads/access": typeof threads_access;
  "threads/model": typeof threads_model;
  "threads/table": typeof threads_table;
  users: typeof users;
  "users/model": typeof users_model;
  "users/rules": typeof users_rules;
  "users/table": typeof users_table;
  "users/username": typeof users_username;
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
  dodopayments: import("@dodopayments/convex/_generated/component.js").ComponentApi<"dodopayments">;
};
