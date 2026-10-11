import { describe, expect, it } from "vitest";
import { Route } from "~/routes/_shell/_authed/s/$slug/team";
import { TeamPage } from "./TeamPage";

describe("team route", () => {
	it("renders the Team page", () => {
		expect(Route.options.component).toBe(TeamPage);
	});
});
