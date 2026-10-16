import {
	startupCategory,
	startupCity,
	startupStage,
} from "@convex/shared/validators";
import { describe, expect, test } from "vitest";
import { CITIES, KINDS, STAGES } from "./startupChips";

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
});
