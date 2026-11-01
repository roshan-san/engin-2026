import {
	startupCategory,
	startupCity,
	startupStage,
} from "@convex/startups/rules";
import { describe, expect, test } from "vitest";
import { CITIES, KINDS, STAGES, startupChipLabels } from "./startupChips";

function literalsOf(validator: {
	members: readonly { value: string }[];
}): string[] {
	return validator.members.map((member) => member.value);
}

describe("startup chips", () => {
	test("Stage chips are exactly the schema's stages", () => {
		expect(STAGES.map((chip) => chip.value).sort()).toEqual(
			literalsOf(startupStage).sort(),
		);
	});

	test("Kind chips are exactly the schema's categories", () => {
		expect(KINDS.map((chip) => chip.value).sort()).toEqual(
			literalsOf(startupCategory).sort(),
		);
	});

	test("City chips are exactly the schema's cities", () => {
		expect(CITIES.map((chip) => chip.value).sort()).toEqual(
			literalsOf(startupCity).sort(),
		);
	});

	test("a Startup's labels skip what it hasn't set", () => {
		expect(startupChipLabels({})).toEqual([]);
		expect(startupChipLabels({ stage: "building", city: "bengaluru" })).toEqual(
			["Building", "Bengaluru"],
		);
		expect(
			startupChipLabels({ stage: "idea", category: "ai", city: "pune" }),
		).toEqual(["Idea", "AI", "Pune"]);
	});
});
