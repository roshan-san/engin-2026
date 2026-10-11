import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { Route as ExploreRoute } from "~/routes/_shell/explore/index";
import { Route as HackathonsRoute } from "~/routes/_shell/explore/hackathons";
import { Route as StartupsRoute } from "~/routes/_shell/explore/startups";
import { ExploreHackathons } from "./ExploreHackathons";
import { ExploreStartups } from "./ExploreStartups";
import { parseHackathonSearch, parseStartupSearch } from "./exploreSearch";

describe("explore routes", () => {
	it("each route renders its page", () => {
		expect(HackathonsRoute.options.component).toBe(ExploreHackathons);
		expect(StartupsRoute.options.component).toBe(ExploreStartups);
	});

	it("filters in the URL go through the pure parsers", () => {
		expect(HackathonsRoute.options.validateSearch).toBe(parseHackathonSearch);
		expect(StartupsRoute.options.validateSearch).toBe(parseStartupSearch);
	});

	it("the bare Explore route sends you to Hackathons", () => {
		let thrown: unknown;
		try {
			ExploreRoute.options.beforeLoad?.({} as never);
		} catch (error) {
			thrown = error;
		}

		expect(isRedirect(thrown)).toBe(true);
	});
});
