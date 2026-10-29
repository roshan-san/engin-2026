/// <reference types="vite/client" />
import { expect, test } from "vitest";

const OLD_EXPORTS: Record<
	string,
	{ module: string; names: Record<string, string> }
> = {
	"billing/checkout": { module: "billing", names: { start: "startCheckout" } },
	"billing/portal": { module: "billing", names: { open: "openPortal" } },
	"billing/subscriptions": {
		module: "billing",
		names: {
			sync: "sync",
			mine: "mine",
			paymentIssue: "paymentIssue",
			checkoutCustomer: "checkoutCustomer",
			customerIdFor: "customerIdFor",
		},
	},
	"chat/messages": { module: "messages", names: same(["list", "send", "pin"]) },
	"chat/presence": {
		module: "presence",
		names: same(["list", "heartbeat", "disconnect"]),
	},
	"chat/threads": { module: "threads", names: same(["list", "markRead"]) },
	"files/files": { module: "files", names: same(["generateUploadUrl"]) },
	"hiring/applications": {
		module: "applications",
		names: same([
			"listForHackathon",
			"getApplicant",
			"apply",
			"accept",
			"decline",
			"shortlist",
			"markWalkthrough",
			"decide",
			"keepPromise",
		]),
	},
	"hiring/hackathons": {
		module: "hackathons",
		names: same([
			"list",
			"get",
			"getPublic",
			"explore",
			"create",
			"update",
			"publish",
			"goLive",
			"declineApplied",
			"copyCardsFor",
			"startDeciding",
			"closeDeciding",
		]),
	},
	"people/places": { module: "places", names: same(["list"]) },
	"people/users": {
		module: "users",
		names: same(["getMe", "getRecord", "updateProfile"]),
	},
	"site/maintenance": { module: "maintenance", names: same(["status", "set"]) },
	"startups/contributors": {
		module: "contributors",
		names: same(["list", "remove"]),
	},
	"startups/invites": {
		module: "invites",
		names: same(["list", "listMine", "create", "revoke", "accept", "decline"]),
	},
	"startups/startups": {
		module: "startups",
		names: same(["getBySlug", "getPublic", "explore", "create", "update"]),
	},
	"work/activity": {
		module: "activity",
		names: same(["list", "getSignals", "listPublic"]),
	},
	"work/cards": {
		module: "cards",
		names: same([
			"listBoard",
			"listParticipantBoard",
			"listReviewQueue",
			"get",
			"create",
			"update",
			"move",
			"submit",
			"verify",
			"remove",
		]),
	},
	"work/cycles": { module: "cycles", names: same(["getCurrent", "setGoal"]) },
	"work/rating": {
		module: "rating",
		names: same(["rateStartups", "rateUsers"]),
	},
};

function same(names: string[]): Record<string, string> {
	return Object.fromEntries(names.map((n) => [n, n]));
}

const loaders = import.meta.glob<Record<string, unknown>>("../**/*.ts");

async function load(path: string) {
	const loader = loaders[`../${path}.ts`];
	if (!loader) throw new Error(`cannot find module ../${path}`);
	return loader();
}

test("every old path still exports its functions, identical to the new ones", async () => {
	for (const [old, { module, names }] of Object.entries(OLD_EXPORTS)) {
		const oldMod = await load(old);
		const newMod = await load(module);
		expect(Object.keys(oldMod).sort(), old).toEqual(Object.keys(names).sort());
		for (const [oldName, newName] of Object.entries(names)) {
			expect(oldMod[oldName], `${old}:${oldName}`).toBe(newMod[newName]);
		}
	}
});
