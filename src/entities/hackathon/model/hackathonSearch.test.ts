import { describe, expect, test } from "vitest";
import { hasFilters } from "~/shared/lib/search";
import { parseHackathonSearch } from "./hackathonSearch";

describe("hackathon search", () => {
	test("known chips are kept", () => {
		const search = parseHackathonSearch({
			role: "frontend",
			weeks: "2",
			paid: "true",
		});

		expect(search).toEqual({ role: "frontend", weeks: 2, paid: true });
	});

	test("chips the router already decoded are kept", () => {
		const search = parseHackathonSearch({ weeks: 1, paid: true });

		expect(search).toEqual({ weeks: 1, paid: true });
	});

	test("unknown values are dropped", () => {
		const search = parseHackathonSearch({
			role: "wizard",
			weeks: 3,
			paid: "yes",
		});

		expect(search).toEqual({});
		expect(hasFilters(search)).toBe(false);
	});

	test("paid false is dropped", () => {
		expect(parseHackathonSearch({ paid: "false" })).toEqual({});
		expect(parseHackathonSearch({ paid: false })).toEqual({});
	});

	test("only known filters reach the query, whatever else the URL carries", () => {
		const fromRouter = { paid: true, utm_source: "x" };

		expect(Object.keys(parseHackathonSearch(fromRouter)).sort()).toEqual([
			"paid",
			"role",
			"weeks",
		]);
		expect(parseHackathonSearch(fromRouter).paid).toBe(true);
	});
});
