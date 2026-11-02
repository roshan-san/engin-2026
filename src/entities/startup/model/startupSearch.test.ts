import { describe, expect, test } from "vitest";
import { parseStartupSearch } from "./startupSearch";

describe("startup search", () => {
	test("known chips are kept", () => {
		const search = parseStartupSearch({
			stage: "building",
			city: "bengaluru",
		});

		expect(search).toEqual({ stage: "building", city: "bengaluru" });
	});

	test("unknown values are dropped", () => {
		expect(parseStartupSearch({ stage: "bogus", city: 3 })).toEqual({});
	});

	test("an old Kind in the URL is ignored", () => {
		expect(parseStartupSearch({ category: "saas" })).toEqual({});
		expect(parseStartupSearch({ category: "saas" })).not.toHaveProperty(
			"category",
		);
	});

	test("only known filters reach the query, whatever else the URL carries", () => {
		const fromRouter = { stage: "idea", category: "saas", utm_source: "x" };

		expect(Object.keys(parseStartupSearch(fromRouter)).sort()).toEqual([
			"city",
			"stage",
		]);
		expect(parseStartupSearch(fromRouter).stage).toBe("idea");
	});
});
