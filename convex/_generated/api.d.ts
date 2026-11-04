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
import type * as activity_rules from "../activity/rules.js";
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
import type * as contributors_rules from "../contributors/rules.js";
import type * as contributors_table from "../contributors/table.js";
import type * as crons from "../crons.js";
import type * as cycles from "../cycles.js";
import type * as cycles_model from "../cycles/model.js";
import type * as cycles_rules from "../cycles/rules.js";
import type * as cycles_table from "../cycles/table.js";
import type * as email from "../email.js";
import type * as email_copy from "../email/copy.js";
import type * as email_model from "../email/model.js";
import type * as email_reminders from "../email/reminders.js";
import type * as email_rules from "../email/rules.js";
import type * as email_table from "../email/table.js";
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
import type * as invites_rules from "../invites/rules.js";
import type * as invites_table from "../invites/table.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_disciplines from "../lib/disciplines.js";
import type * as lib_explore from "../lib/explore.js";
import type * as lib_returnPath from "../lib/returnPath.js";
import type * as lib_text from "../lib/text.js";
import type * as maintenance from "../maintenance.js";
import type * as maintenance_model from "../maintenance/model.js";
import type * as maintenance_table from "../maintenance/table.js";
import type * as messages from "../messages.js";
import type * as messages_model from "../messages/model.js";
import type * as messages_rules from "../messages/rules.js";
import type * as messages_table from "../messages/table.js";
import type * as migrations from "../migrations.js";
import type * as momentum from "../momentum.js";
import type * as momentum_credit from "../momentum/credit.js";
import type * as momentum_model from "../momentum/model.js";
import type * as momentum_rules from "../momentum/rules.js";
import type * as momentum_table from "../momentum/table.js";
import type * as momentum_trust from "../momentum/trust.js";
import type * as places from "../places.js";
import type * as places_model from "../places/model.js";
import type * as places_rules from "../places/rules.js";
import type * as push from "../push.js";
import type * as push_model from "../push/model.js";
import type * as push_rules from "../push/rules.js";
import type * as push_send from "../push/send.js";
import type * as push_table from "../push/table.js";
import type * as startups from "../startups.js";
import type * as startups_model from "../startups/model.js";
import type * as startups_rules from "../startups/rules.js";
import type * as startups_table from "../startups/table.js";
import type * as startups_team from "../startups/team.js";
import type * as threads from "../threads.js";
import type * as threads_access from "../threads/access.js";
import type * as threads_model from "../threads/model.js";
import type * as threads_rules from "../threads/rules.js";
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
  "activity/rules": typeof activity_rules;
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
  "contributors/rules": typeof contributors_rules;
  "contributors/table": typeof contributors_table;
  crons: typeof crons;
  cycles: typeof cycles;
  "cycles/model": typeof cycles_model;
  "cycles/rules": typeof cycles_rules;
  "cycles/table": typeof cycles_table;
  email: typeof email;
  "email/copy": typeof email_copy;
  "email/model": typeof email_model;
  "email/reminders": typeof email_reminders;
  "email/rules": typeof email_rules;
  "email/table": typeof email_table;
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
  "invites/rules": typeof invites_rules;
  "invites/table": typeof invites_table;
  "lib/auth": typeof lib_auth;
  "lib/disciplines": typeof lib_disciplines;
  "lib/explore": typeof lib_explore;
  "lib/returnPath": typeof lib_returnPath;
  "lib/text": typeof lib_text;
  maintenance: typeof maintenance;
  "maintenance/model": typeof maintenance_model;
  "maintenance/table": typeof maintenance_table;
  messages: typeof messages;
  "messages/model": typeof messages_model;
  "messages/rules": typeof messages_rules;
  "messages/table": typeof messages_table;
  migrations: typeof migrations;
  momentum: typeof momentum;
  "momentum/credit": typeof momentum_credit;
  "momentum/model": typeof momentum_model;
  "momentum/rules": typeof momentum_rules;
  "momentum/table": typeof momentum_table;
  "momentum/trust": typeof momentum_trust;
  places: typeof places;
  "places/model": typeof places_model;
  "places/rules": typeof places_rules;
  push: typeof push;
  "push/model": typeof push_model;
  "push/rules": typeof push_rules;
  "push/send": typeof push_send;
  "push/table": typeof push_table;
  startups: typeof startups;
  "startups/model": typeof startups_model;
  "startups/rules": typeof startups_rules;
  "startups/table": typeof startups_table;
  "startups/team": typeof startups_team;
  threads: typeof threads;
  "threads/access": typeof threads_access;
  "threads/model": typeof threads_model;
  "threads/rules": typeof threads_rules;
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
  dodopayments: import("@dodopayments/convex/_generated/component.js").ComponentApi<"dodopayments">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
