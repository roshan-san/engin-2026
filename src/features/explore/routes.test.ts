import {
	createMemoryHistory,
	createRouter,
	isRedirect,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { Route as HackathonsRoute } from "~/routes/_shell/explore/hackathons";
import { Route as ExploreRoute } from "~/routes/_shell/explore/index";
import { Route as StartupsRoute } from "~/routes/_shell/explore/startups";
import { routeTree } from "~/routeTree.gen";
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

	it.each([
		"/explore/startups?stage=bogus&city=mars&category=x",
		"/explore/hackathons?role=wizard&weeks=3&paid=yes",
	])("a bad filter in %s reaches the page as no filter", async (url) => {
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({ initialEntries: [url] }),
		});

		await router.load();

		const search = router.state.matches.at(-1)?.search ?? {};
		expect(
			Object.values(search).filter((value) => value !== undefined),
		).toEqual([]);
	});
});
