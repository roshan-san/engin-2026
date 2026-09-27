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
import type * as cycles from "../cycles.js";
import type * as dodo from "../dodo.js";
import type * as explore from "../explore.js";
import type * as follows from "../follows.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_hiring_entries from "../lib/hiring/entries.js";
import type * as lib_hiring_offers from "../lib/hiring/offers.js";
import type * as lib_hiring_trialCycles from "../lib/hiring/trialCycles.js";
import type * as lib_hiring_verdicts from "../lib/hiring/verdicts.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_people_username from "../lib/people/username.js";
import type * as lib_people_users from "../lib/people/users.js";
import type * as lib_reputation_proofOfWork from "../lib/reputation/proofOfWork.js";
import type * as lib_reputation_score from "../lib/reputation/score.js";
import type * as lib_reputation_scoreWeights from "../lib/reputation/scoreWeights.js";
import type * as lib_reputation_trialHistory from "../lib/reputation/trialHistory.js";
import type * as lib_teams_catalog from "../lib/teams/catalog.js";
import type * as lib_teams_invites from "../lib/teams/invites.js";
import type * as lib_teams_membership from "../lib/teams/membership.js";
import type * as lib_teams_startupWrite from "../lib/teams/startupWrite.js";
import type * as lib_text from "../lib/text.js";
import type * as lib_work_cycles from "../lib/work/cycles.js";
import type * as lib_work_pulses from "../lib/work/pulses.js";
import type * as members from "../members.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as offers from "../offers.js";
import type * as opportunities from "../opportunities.js";
import type * as people_billing from "../people/billing.js";
import type * as people_users from "../people/users.js";
import type * as pulses from "../pulses.js";
import type * as roles from "../roles.js";
import type * as startups from "../startups.js";
import type * as trialCycles from "../trialCycles.js";
import type * as trialMessages from "../trialMessages.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applications: typeof applications;
  auth: typeof auth;
  cycles: typeof cycles;
  dodo: typeof dodo;
  explore: typeof explore;
  follows: typeof follows;
  http: typeof http;
  invitations: typeof invitations;
  "lib/auth": typeof lib_auth;
  "lib/hiring/entries": typeof lib_hiring_entries;
  "lib/hiring/offers": typeof lib_hiring_offers;
  "lib/hiring/trialCycles": typeof lib_hiring_trialCycles;
  "lib/hiring/verdicts": typeof lib_hiring_verdicts;
  "lib/limits": typeof lib_limits;
  "lib/notify": typeof lib_notify;
  "lib/people/username": typeof lib_people_username;
  "lib/people/users": typeof lib_people_users;
  "lib/reputation/proofOfWork": typeof lib_reputation_proofOfWork;
  "lib/reputation/score": typeof lib_reputation_score;
  "lib/reputation/scoreWeights": typeof lib_reputation_scoreWeights;
  "lib/reputation/trialHistory": typeof lib_reputation_trialHistory;
  "lib/teams/catalog": typeof lib_teams_catalog;
  "lib/teams/invites": typeof lib_teams_invites;
  "lib/teams/membership": typeof lib_teams_membership;
  "lib/teams/startupWrite": typeof lib_teams_startupWrite;
  "lib/text": typeof lib_text;
  "lib/work/cycles": typeof lib_work_cycles;
  "lib/work/pulses": typeof lib_work_pulses;
  members: typeof members;
  migrations: typeof migrations;
  notifications: typeof notifications;
  offers: typeof offers;
  opportunities: typeof opportunities;
  "people/billing": typeof people_billing;
  "people/users": typeof people_users;
  pulses: typeof pulses;
  roles: typeof roles;
  startups: typeof startups;
  trialCycles: typeof trialCycles;
  trialMessages: typeof trialMessages;
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
