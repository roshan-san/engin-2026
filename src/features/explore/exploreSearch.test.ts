import { describe, expect, test } from "vitest";
import { parseHackathonSearch, parseStartupSearch } from "./exploreSearch";

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
	});

	test("paid false is dropped", () => {
		expect(parseHackathonSearch({ paid: "false" })).toEqual({});
		expect(parseHackathonSearch({ paid: false })).toEqual({});
	});
});

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
