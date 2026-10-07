import { describe, expect, it } from "vitest";
import { buildShellContext, buildSwitchTarget } from "./context";

const acme = [{ slug: "acme" }];
const youLabels = ["Inbox", "My Tasks", "My Hackathons", "Threads"];

function build(
	pathname: string,
	...rest: [memberships?: { slug: string }[] | undefined]
) {
	const memberships = rest.length > 0 ? rest[0] : acme;
	return buildShellContext({ pathname, memberships });
}

describe("buildShellContext", () => {
	it.each([
		"/inbox",
		"/my-tasks/",
		"/my-hackathons",
		"/threads/abc",
		"/profile",
		"/startups/new",
	])("treats %s as the You context with four tabs", (pathname) => {
		const context = build(pathname);

		expect(context.kind).toBe("you");
		if (context.kind !== "you") return;
		expect(context.tabs.map((t) => t.label)).toEqual(youLabels);
	});

	it("marks Threads active on a thread detail path", () => {
		const context = build("/threads/abc");

		expect(context.kind === "you" && context.activeTab?.label).toBe("Threads");
	});

	it("marks My Tasks active despite a trailing slash", () => {
		const context = build("/my-tasks/");

		expect(context.kind === "you" && context.activeTab?.label).toBe("My Tasks");
	});

	it("has no active tab on the profile page", () => {
		const context = build("/profile");

		expect(context.kind === "you" && context.activeTab).toBeUndefined();
	});

	it("has no active tab on the new Startup page", () => {
		const context = build("/startups/new");

		expect(context.kind === "you" && context.activeTab).toBeUndefined();
	});

	it("gives a member the Startup context with concrete tab links", () => {
		const context = build("/s/acme/hiring");

		expect(context.kind).toBe("startup");
		if (context.kind !== "startup") return;
		expect(context.slug).toBe("acme");
		expect(context.tabs.map((t) => t.href)).toEqual([
			"/s/acme/cycles",
			"/s/acme/hiring",
			"/s/acme/team",
			"/s/acme/pitch",
			"/s/acme/activity",
			"/s/acme/settings",
		]);
		expect(context.activeTab?.label).toBe("Hiring");
	});

	it("puts Settings in the overflow", () => {
		const context = build("/s/acme/settings");

		if (context.kind !== "startup") throw new Error("expected startup");
		expect(context.tabs.filter((t) => t.overflow).map((t) => t.label)).toEqual([
			"Settings",
		]);
		expect(context.activeTab?.label).toBe("Settings");
	});

	it("keeps Hiring active on a hackathon detail path", () => {
		const context = build("/s/acme/hackathons/h1");

		expect(context.kind === "startup" && context.activeTab?.label).toBe(
			"Hiring",
		);
	});

	it("does not match a tab on a partial segment", () => {
		const context = build("/s/acme/hiringx");

		expect(context.kind).toBe("startup");
		expect(context.kind === "startup" && context.activeTab).toBeUndefined();
	});

	it("marks Cycles active on a Cycle detail path", () => {
		const context = build("/s/acme/cycles/c1");

		expect(context.kind === "startup" && context.activeTab?.label).toBe(
			"Cycles",
		);
	});

	it("gives a member the Startup context with no active tab on the bare Startup path", () => {
		const context = build("/s/acme");

		expect(context.kind).toBe("startup");
		expect(context.kind === "startup" && context.activeTab).toBeUndefined();
	});

	it("is loading while memberships are loading", () => {
		expect(build("/s/acme/team", undefined)).toEqual({ kind: "loading" });
	});

	it("is neutral for a user with no Startups", () => {
		expect(build("/s/acme/team", [])).toEqual({ kind: "neutral" });
	});

	it("is neutral for a Startup the user does not belong to", () => {
		expect(build("/s/acme/team", [{ slug: "beta" }])).toEqual({
			kind: "neutral",
		});
	});

	it("marks People active on the Explore people tab", () => {
		const context = build("/explore/people");

		expect(context.kind).toBe("explore");
		if (context.kind !== "explore") return;
		expect(context.tabs.map((t) => t.label)).toEqual([
			"Startups",
			"Hackathons",
			"People",
		]);
		expect(context.activeTab?.label).toBe("People");
	});

	it("has no active tab on bare Explore", () => {
		const context = build("/explore");

		expect(context.kind).toBe("explore");
		expect(context.kind === "explore" && context.activeTab).toBeUndefined();
	});

	it.each([
		"/hackathons/h1",
		"/startup/acme",
		"/u/cara",
		"/invite/t",
		"/pricing",
	])("treats %s as neutral", (pathname) => {
		expect(build(pathname)).toEqual({ kind: "neutral" });
	});
});

describe("buildSwitchTarget", () => {
	const switchTo = (
		pathname: string,
		target: Parameters<typeof buildSwitchTarget>[0]["target"],
	) => buildSwitchTarget({ pathname, target });

	it("keeps the Hiring section when switching Startup", () => {
		expect(switchTo("/s/acme/hiring", { slug: "beta" })).toBe("/s/beta/hiring");
	});

	it("maps a hackathon detail to the other Startup's Hiring", () => {
		expect(switchTo("/s/acme/hackathons/h1", { slug: "beta" })).toBe(
			"/s/beta/hiring",
		);
	});

	it("drops a Cycle id when switching Startup", () => {
		expect(switchTo("/s/acme/cycles/c1", { slug: "beta" })).toBe(
			"/s/beta/cycles",
		);
	});

	it("keeps Settings when switching Startup", () => {
		expect(switchTo("/s/acme/settings", { slug: "beta" })).toBe(
			"/s/beta/settings",
		);
	});

	it("lands on Cycles when switching from outside a Startup", () => {
		expect(switchTo("/inbox", { slug: "beta" })).toBe("/s/beta/cycles");
	});

	it("lands on Cycles when switching from the bare Startup path", () => {
		expect(switchTo("/s/acme", { slug: "beta" })).toBe("/s/beta/cycles");
	});

	it("lands on My Tasks when switching to You", () => {
		expect(switchTo("/s/acme/hiring", "you")).toBe("/my-tasks");
	});

	it("lands on Explore Startups when switching to Explore", () => {
		expect(switchTo("/s/acme/hiring", "explore")).toBe("/explore/startups");
	});
});
