import { expect, it } from "vitest";
import { type Crumb, crumbReducer } from "./crumbs";

const cycle: Crumb = { owner: 1, label: "Sprint 4", href: "/s/acme/cycles/c1" };
const hackathon: Crumb = {
	owner: 2,
	label: "Spring Hackathon",
	href: "/s/acme/hackathons/h1",
};

it("a set replaces the current crumb", () => {
	const state = crumbReducer(cycle, { type: "set", crumb: hackathon });

	expect(state).toEqual(hackathon);
});

it("an unset by the crumb's owner clears it", () => {
	const state = crumbReducer(cycle, { type: "unset", owner: 1 });

	expect(state).toBeNull();
});

it("an unset by an older owner leaves a newer crumb in place", () => {
	const state = crumbReducer(hackathon, { type: "unset", owner: 1 });

	expect(state).toEqual(hackathon);
});
