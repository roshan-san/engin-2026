import { describe, expect, test } from "vitest";
import { hasFilters } from "./search";

describe("has filters", () => {
	test("no keys means no filters", () => {
		expect(hasFilters({})).toBe(false);
	});

	test("a Hackathon role or the paid chip counts", () => {
		expect(hasFilters({ role: "frontend" })).toBe(true);
		expect(hasFilters({ paid: true })).toBe(true);
		expect(hasFilters({ weeks: 2 })).toBe(true);
	});

	test("a Startup stage, kind or city counts", () => {
		expect(hasFilters({ stage: "building" })).toBe(true);
		expect(hasFilters({ category: "saas" })).toBe(true);
		expect(hasFilters({ city: "bengaluru" })).toBe(true);
	});

	test("keys the parser left undefined do not count", () => {
		expect(hasFilters({ city: undefined })).toBe(false);
	});
});
