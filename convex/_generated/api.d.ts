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
import type * as billing_portal from "../billing/portal.js";
import type * as billing_subscriptions from "../billing/subscriptions.js";
import type * as chat_messages from "../chat/messages.js";
import type * as chat_presence from "../chat/presence.js";
import type * as chat_threads from "../chat/threads.js";
import type * as crons from "../crons.js";
import type * as files_files from "../files/files.js";
import type * as hiring_applications from "../hiring/applications.js";
import type * as hiring_hackathons from "../hiring/hackathons.js";
import type * as http from "../http.js";
import type * as model_activity from "../model/activity.js";
import type * as model_applications from "../model/applications.js";
import type * as model_auth from "../model/auth.js";
import type * as model_billing from "../model/billing.js";
import type * as model_cards from "../model/cards.js";
import type * as model_contributors from "../model/contributors.js";
import type * as model_dodo from "../model/dodo.js";
import type * as model_files from "../model/files.js";
import type * as model_goals from "../model/goals.js";
import type * as model_hackathonLifecycle from "../model/hackathonLifecycle.js";
import type * as model_hackathons from "../model/hackathons.js";
import type * as model_hiringRecord from "../model/hiringRecord.js";
import type * as model_invites from "../model/invites.js";
import type * as model_maintenance from "../model/maintenance.js";
import type * as model_messages from "../model/messages.js";
import type * as model_places from "../model/places.js";
import type * as model_presence from "../model/presence.js";
import type * as model_rating from "../model/rating.js";
import type * as model_startups from "../model/startups.js";
import type * as model_teamAccess from "../model/teamAccess.js";
import type * as model_text from "../model/text.js";
import type * as model_threadAccess from "../model/threadAccess.js";
import type * as model_threads from "../model/threads.js";
import type * as model_username from "../model/username.js";
import type * as model_users from "../model/users.js";
import type * as people_places from "../people/places.js";
import type * as people_users from "../people/users.js";
import type * as shared_applicationRules from "../shared/applicationRules.js";
import type * as shared_cardRules from "../shared/cardRules.js";
import type * as shared_cycles from "../shared/cycles.js";
import type * as shared_hackathonPhase from "../shared/hackathonPhase.js";
import type * as shared_limits from "../shared/limits.js";
import type * as shared_mentions from "../shared/mentions.js";
import type * as shared_places from "../shared/places.js";
import type * as shared_plans from "../shared/plans.js";
import type * as shared_returnPath from "../shared/returnPath.js";
import type * as shared_tiers from "../shared/tiers.js";
import type * as shared_username from "../shared/username.js";
import type * as shared_validators from "../shared/validators.js";
import type * as site_maintenance from "../site/maintenance.js";
import type * as startups_contributors from "../startups/contributors.js";
import type * as startups_invites from "../startups/invites.js";
import type * as startups_startups from "../startups/startups.js";
import type * as tables_billing from "../tables/billing.js";
import type * as tables_chat from "../tables/chat.js";
import type * as tables_hiring from "../tables/hiring.js";
import type * as tables_people from "../tables/people.js";
import type * as tables_site from "../tables/site.js";
import type * as tables_startups from "../tables/startups.js";
import type * as tables_work from "../tables/work.js";
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
  "billing/checkout": typeof billing_checkout;
  "billing/portal": typeof billing_portal;
  "billing/subscriptions": typeof billing_subscriptions;
  "chat/messages": typeof chat_messages;
  "chat/presence": typeof chat_presence;
  "chat/threads": typeof chat_threads;
  crons: typeof crons;
  "files/files": typeof files_files;
  "hiring/applications": typeof hiring_applications;
  "hiring/hackathons": typeof hiring_hackathons;
  http: typeof http;
  "model/activity": typeof model_activity;
  "model/applications": typeof model_applications;
  "model/auth": typeof model_auth;
  "model/billing": typeof model_billing;
  "model/cards": typeof model_cards;
  "model/contributors": typeof model_contributors;
  "model/dodo": typeof model_dodo;
  "model/files": typeof model_files;
  "model/goals": typeof model_goals;
  "model/hackathonLifecycle": typeof model_hackathonLifecycle;
  "model/hackathons": typeof model_hackathons;
  "model/hiringRecord": typeof model_hiringRecord;
  "model/invites": typeof model_invites;
  "model/maintenance": typeof model_maintenance;
  "model/messages": typeof model_messages;
  "model/places": typeof model_places;
  "model/presence": typeof model_presence;
  "model/rating": typeof model_rating;
  "model/startups": typeof model_startups;
  "model/teamAccess": typeof model_teamAccess;
  "model/text": typeof model_text;
  "model/threadAccess": typeof model_threadAccess;
  "model/threads": typeof model_threads;
  "model/username": typeof model_username;
  "model/users": typeof model_users;
  "people/places": typeof people_places;
  "people/users": typeof people_users;
  "shared/applicationRules": typeof shared_applicationRules;
  "shared/cardRules": typeof shared_cardRules;
  "shared/cycles": typeof shared_cycles;
  "shared/hackathonPhase": typeof shared_hackathonPhase;
  "shared/limits": typeof shared_limits;
  "shared/mentions": typeof shared_mentions;
  "shared/places": typeof shared_places;
  "shared/plans": typeof shared_plans;
  "shared/returnPath": typeof shared_returnPath;
  "shared/tiers": typeof shared_tiers;
  "shared/username": typeof shared_username;
  "shared/validators": typeof shared_validators;
  "site/maintenance": typeof site_maintenance;
  "startups/contributors": typeof startups_contributors;
  "startups/invites": typeof startups_invites;
  "startups/startups": typeof startups_startups;
  "tables/billing": typeof tables_billing;
  "tables/chat": typeof tables_chat;
  "tables/hiring": typeof tables_hiring;
  "tables/people": typeof tables_people;
  "tables/site": typeof tables_site;
  "tables/startups": typeof tables_startups;
  "tables/work": typeof tables_work;
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
  dodopayments: import("@dodopayments/convex/_generated/component.js").ComponentApi<"dodopayments">;
};
