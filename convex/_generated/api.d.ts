/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as cycles from "../cycles.js";
import type * as dodo from "../dodo.js";
import type * as explore from "../explore.js";
import type * as follows from "../follows.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_catalog from "../lib/catalog.js";
import type * as lib_entries from "../lib/entries.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_membership from "../lib/membership.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_offers from "../lib/offers.js";
import type * as lib_pulses from "../lib/pulses.js";
import type * as lib_score from "../lib/score.js";
import type * as lib_scoreWeights from "../lib/scoreWeights.js";
import type * as lib_startupWrite from "../lib/startupWrite.js";
import type * as lib_text from "../lib/text.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_trials from "../lib/trials.js";
import type * as lib_username from "../lib/username.js";
import type * as lib_users from "../lib/users.js";
import type * as lib_verdicts from "../lib/verdicts.js";
import type * as members from "../members.js";
import type * as notifications from "../notifications.js";
import type * as offers from "../offers.js";
import type * as opportunities from "../opportunities.js";
import type * as pulses from "../pulses.js";
import type * as roles from "../roles.js";
import type * as startups from "../startups.js";
import type * as trialCycles from "../trialCycles.js";
import type * as trialMessages from "../trialMessages.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applications: typeof applications;
  auth: typeof auth;
  billing: typeof billing;
  cycles: typeof cycles;
  dodo: typeof dodo;
  explore: typeof explore;
  follows: typeof follows;
  http: typeof http;
  invitations: typeof invitations;
  "lib/auth": typeof lib_auth;
  "lib/catalog": typeof lib_catalog;
  "lib/entries": typeof lib_entries;
  "lib/limits": typeof lib_limits;
  "lib/membership": typeof lib_membership;
  "lib/notify": typeof lib_notify;
  "lib/offers": typeof lib_offers;
  "lib/pulses": typeof lib_pulses;
  "lib/score": typeof lib_score;
  "lib/scoreWeights": typeof lib_scoreWeights;
  "lib/startupWrite": typeof lib_startupWrite;
  "lib/text": typeof lib_text;
  "lib/time": typeof lib_time;
  "lib/trials": typeof lib_trials;
  "lib/username": typeof lib_username;
  "lib/users": typeof lib_users;
  "lib/verdicts": typeof lib_verdicts;
  members: typeof members;
  notifications: typeof notifications;
  offers: typeof offers;
  opportunities: typeof opportunities;
  pulses: typeof pulses;
  roles: typeof roles;
  startups: typeof startups;
  trialCycles: typeof trialCycles;
  trialMessages: typeof trialMessages;
  users: typeof users;
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
  dodopayments: import("@dodopayments/convex/_generated/component.js").ComponentApi<"dodopayments">;
};
