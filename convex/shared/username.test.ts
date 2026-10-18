import { describe, expect, test } from "vitest";
import { usernameProblem } from "./username";

describe("usernameProblem", () => {
	test("a name under three characters is too short", () => {
		expect(usernameProblem("ab")).toMatch(/at least 3/i);
		expect(usernameProblem("")).toMatch(/at least 3/i);
	});

	test("a name must start with a letter", () => {
		expect(usernameProblem("1abc")).toMatch(/start with a letter/i);
		expect(usernameProblem("_abc")).toMatch(/start with a letter/i);
	});

	test("a name over twenty characters is too long", () => {
		expect(usernameProblem("a".repeat(21))).toMatch(/at most 20/i);
		expect(usernameProblem("a".repeat(20))).toBeNull();
	});

	test("letters, numbers and underscores are fine", () => {
		expect(usernameProblem("asha_r")).toBeNull();
		expect(usernameProblem("asha_r9")).toBeNull();
	});

	test("other characters are not allowed", () => {
		expect(usernameProblem("asha-r")).toMatch(/letters, numbers/i);
		expect(usernameProblem("asha r")).toMatch(/letters, numbers/i);
	});

	test("capitals are fine because the server lowercases the name", () => {
		expect(usernameProblem("Asha")).toBeNull();
	});

	test("surrounding spaces are ignored like the server does", () => {
		expect(usernameProblem("  asha  ")).toBeNull();
	});

	test("a reserved name is not available", () => {
		expect(usernameProblem("admin")).toBe("This username is not available");
		expect(usernameProblem("Settings")).toBe("This username is not available");
	});
});
