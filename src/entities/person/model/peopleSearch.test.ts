import { describe, expect, test } from "vitest";
import { parsePeopleSearch } from "./peopleSearch";

describe("parsePeopleSearch", () => {
	test("keeps a discipline from the list", () => {
		expect(parsePeopleSearch({ discipline: "sales" })).toEqual({
			discipline: "sales",
		});
	});

	test("drops anything else, so a bad link shows everyone", () => {
		expect(parsePeopleSearch({ discipline: "ops", utm: "x" })).toEqual({
			discipline: undefined,
		});
	});
});
