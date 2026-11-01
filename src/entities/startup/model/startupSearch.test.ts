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
});
