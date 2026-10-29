import { describe, expect, it } from "vitest";
import { changedFields } from "./changedFields";

describe("changedFields", () => {
	it("keeps only the fields that differ", () => {
		expect(
			changedFields(
				{ name: "Acme", city: "pune" },
				{ name: "Acme", city: "goa" },
			),
		).toEqual({ city: "pune" });
	});

	it("is empty when nothing changed", () => {
		expect(changedFields({ name: "Acme" }, { name: "Acme" })).toEqual({});
	});

	it("keeps a field cleared to null or blank", () => {
		expect(
			changedFields(
				{ bio: "", discipline: null },
				{ bio: "Hi", discipline: "design" },
			),
		).toEqual({ bio: "", discipline: null });
	});
});
