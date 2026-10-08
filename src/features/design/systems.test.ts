import { describe, expect, it } from "vitest";
import { DESIGN_SYSTEMS, parseDesignSystem } from "./systems";

describe("parseDesignSystem", () => {
	it.each(["geist", "linear", "zinc"])("accepts %s", (value) => {
		expect(parseDesignSystem(value)).toBe(value);
	});

	it.each([undefined, "", "foo", "GEIST", 3, ["linear"]])(
		"falls back to geist for %j",
		(value) => {
			expect(parseDesignSystem(value)).toBe("geist");
		},
	);
});

it("lists the three systems in picker order", () => {
	expect(DESIGN_SYSTEMS.map((system) => system.id)).toEqual([
		"geist",
		"linear",
		"zinc",
	]);
});
