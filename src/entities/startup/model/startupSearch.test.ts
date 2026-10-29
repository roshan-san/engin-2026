import { describe, expect, test } from "vitest";
import { parseStartupSearch } from "./startupSearch";

describe("startup search", () => {
	test("known chips are kept", () => {
		const search = parseStartupSearch({
			stage: "building",
			category: "saas",
			city: "bengaluru",
		});

		expect(search).toEqual({
			stage: "building",
			category: "saas",
			city: "bengaluru",
		});
	});

	test("unknown values are dropped", () => {
		expect(parseStartupSearch({ stage: "bogus", city: 3 })).toEqual({});
		expect(parseStartupSearch({ category: ["saas"], city: null })).toEqual({});
	});
});
