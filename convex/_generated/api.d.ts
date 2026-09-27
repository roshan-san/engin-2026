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
import type * as cycles from "../cycles.js";
import type * as dodo from "../dodo.js";
import type * as hiring_applications from "../hiring/applications.js";
import type * as hiring_offers from "../hiring/offers.js";
import type * as hiring_opportunities from "../hiring/opportunities.js";
import type * as hiring_roles from "../hiring/roles.js";
import type * as hiring_trialCycles from "../hiring/trialCycles.js";
import type * as hiring_trialMessages from "../hiring/trialMessages.js";
import type * as http from "../http.js";
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
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as people_billing from "../people/billing.js";
import type * as people_users from "../people/users.js";
import type * as pulses from "../pulses.js";
import type * as teams_explore from "../teams/explore.js";
import type * as teams_follows from "../teams/follows.js";
import type * as teams_invitations from "../teams/invitations.js";
import type * as teams_members from "../teams/members.js";
import type * as teams_startups from "../teams/startups.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cycles: typeof cycles;
  dodo: typeof dodo;
  "hiring/applications": typeof hiring_applications;
  "hiring/offers": typeof hiring_offers;
  "hiring/opportunities": typeof hiring_opportunities;
  "hiring/roles": typeof hiring_roles;
  "hiring/trialCycles": typeof hiring_trialCycles;
  "hiring/trialMessages": typeof hiring_trialMessages;
  http: typeof http;
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
  migrations: typeof migrations;
  notifications: typeof notifications;
  "people/billing": typeof people_billing;
  "people/users": typeof people_users;
  pulses: typeof pulses;
  "teams/explore": typeof teams_explore;
  "teams/follows": typeof teams_follows;
  "teams/invitations": typeof teams_invitations;
  "teams/members": typeof teams_members;
  "teams/startups": typeof teams_startups;
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
