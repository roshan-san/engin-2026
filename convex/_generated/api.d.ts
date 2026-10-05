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
import type * as billing_checkout from "../billing/checkout.js";
import type * as billing_credits from "../billing/credits.js";
import type * as billing_plan from "../billing/plan.js";
import type * as billing_webhooks from "../billing/webhooks.js";
import type * as crons from "../crons.js";
import type * as e2e_seed from "../e2e/seed.js";
import type * as hiring_announcements from "../hiring/announcements.js";
import type * as hiring_applications from "../hiring/applications.js";
import type * as hiring_challenges from "../hiring/challenges.js";
import type * as hiring_offers from "../hiring/offers.js";
import type * as hiring_opportunities from "../hiring/opportunities.js";
import type * as hiring_roles from "../hiring/roles.js";
import type * as hiring_trialCycles from "../hiring/trialCycles.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_links from "../lib/links.js";
import type * as lib_text from "../lib/text.js";
import type * as people_notifications from "../people/notifications.js";
import type * as people_users from "../people/users.js";
import type * as teams_activity from "../teams/activity.js";
import type * as teams_explore from "../teams/explore.js";
import type * as teams_invitations from "../teams/invitations.js";
import type * as teams_members from "../teams/members.js";
import type * as teams_startups from "../teams/startups.js";
import type * as work_cycles from "../work/cycles.js";
import type * as work_pulses from "../work/pulses.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "billing/checkout": typeof billing_checkout;
  "billing/credits": typeof billing_credits;
  "billing/plan": typeof billing_plan;
  "billing/webhooks": typeof billing_webhooks;
  crons: typeof crons;
  "e2e/seed": typeof e2e_seed;
  "hiring/announcements": typeof hiring_announcements;
  "hiring/applications": typeof hiring_applications;
  "hiring/challenges": typeof hiring_challenges;
  "hiring/offers": typeof hiring_offers;
  "hiring/opportunities": typeof hiring_opportunities;
  "hiring/roles": typeof hiring_roles;
  "hiring/trialCycles": typeof hiring_trialCycles;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/limits": typeof lib_limits;
  "lib/links": typeof lib_links;
  "lib/text": typeof lib_text;
  "people/notifications": typeof people_notifications;
  "people/users": typeof people_users;
  "teams/activity": typeof teams_activity;
  "teams/explore": typeof teams_explore;
  "teams/invitations": typeof teams_invitations;
  "teams/members": typeof teams_members;
  "teams/startups": typeof teams_startups;
  "work/cycles": typeof work_cycles;
  "work/pulses": typeof work_pulses;
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
