import { describe, expect, it } from "vitest";
import { greeting } from "./greeting";

// IST is UTC+5:30.
const ist = (hour: number) =>
	Date.UTC(2026, 9, 14, hour, 0) - 5.5 * 60 * 60 * 1000;

describe("greeting", () => {
	it("morning before noon in India", () => {
		expect(greeting(ist(8), "Roshan R")).toBe("Good morning, Roshan");
	});

	it("afternoon until five", () => {
		expect(greeting(ist(14), "Roshan R")).toBe("Good afternoon, Roshan");
	});

	it("evening after five and through the night", () => {
		expect(greeting(ist(19), "Roshan R")).toBe("Good evening, Roshan");
		expect(greeting(ist(2), "Roshan R")).toBe("Good evening, Roshan");
	});

	it("no name, no comma", () => {
		expect(greeting(ist(8), null)).toBe("Good morning");
	});
});
