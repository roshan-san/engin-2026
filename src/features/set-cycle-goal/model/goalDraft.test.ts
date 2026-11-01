import { describe, expect, it } from "vitest";
import { goalToSave } from "./goalDraft";

describe("goalToSave", () => {
	it("gives a new goal, trimmed", () => {
		expect(goalToSave(" Ten users ", null)).toBe("Ten users");
		expect(goalToSave("Twenty users", "Ten users")).toBe("Twenty users");
	});

	it("gives nothing for a blank or unchanged goal", () => {
		expect(goalToSave("   ", null)).toBeNull();
		expect(goalToSave(" Ten users ", "Ten users")).toBeNull();
	});
});
