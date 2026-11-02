import { describe, expect, test } from "vitest";
import { DISCIPLINES, disciplineLabel } from "./disciplines";

describe("disciplines", () => {
	test("the one list, in the order shown", () => {
		expect(DISCIPLINES.map((d) => d.label)).toEqual([
			"Developer",
			"Designer",
			"Marketing",
			"Sales",
			"Other",
		]);
	});

	test("a discipline reads as its label", () => {
		expect(disciplineLabel("developer")).toBe("Developer");
	});
});
