import { describe, expect, it } from "vitest";
import {
	canAdvance,
	INITIAL_STATE,
	type OnboardingState,
	onboardingReducer,
	STEPS,
	toCreateArgs,
} from "./onboarding";

const NAMED: OnboardingState = {
	step: "oneLiner",
	name: "Acme",
	oneLiner: "",
};

describe("onboarding steps", () => {
	it("onboarding asks for a name and one line", () => {
		expect(STEPS).toEqual(["name", "oneLiner"]);
	});

	it("a blank name can't advance", () => {
		const typed = onboardingReducer(INITIAL_STATE, {
			type: "type",
			field: "name",
			value: "   ",
		});

		const next = onboardingReducer(typed, { type: "next" });

		expect(canAdvance(typed)).toBe(false);
		expect(next.step).toBe("name");
	});

	it("a typed name advances to the one line", () => {
		const typed = onboardingReducer(INITIAL_STATE, {
			type: "type",
			field: "name",
			value: "Acme",
		});

		const next = onboardingReducer(typed, { type: "next" });

		expect(next.step).toBe("oneLiner");
	});

	it("back returns to the name with it kept", () => {
		const back = onboardingReducer(NAMED, { type: "back" });

		expect(back).toEqual({ ...NAMED, step: "name" });
	});

	it("back on the first step stays", () => {
		const back = onboardingReducer(INITIAL_STATE, { type: "back" });

		expect(back).toEqual(INITIAL_STATE);
	});

	it("goto returns to an earlier step", () => {
		const next = onboardingReducer(NAMED, { type: "goto", step: "name" });

		expect(next.step).toBe("name");
	});

	it("goto can't skip ahead", () => {
		const next = onboardingReducer(
			{ ...NAMED, step: "name" },
			{ type: "goto", step: "oneLiner" },
		);

		expect(next.step).toBe("name");
	});
});

describe("onboarding create args", () => {
	it("a name is all it takes", () => {
		expect(toCreateArgs({ ...INITIAL_STATE, name: " Acme " })).toEqual({
			name: "Acme",
		});
	});

	it("a typed one line is trimmed and sent", () => {
		const args = toCreateArgs({
			...NAMED,
			oneLiner: " Invoices for tailors ",
		});

		expect(args?.oneLiner).toBe("Invoices for tailors");
	});

	it("create args need a name", () => {
		expect(toCreateArgs(INITIAL_STATE)).toBeNull();
		expect(toCreateArgs({ ...NAMED, name: " " })).toBeNull();
	});
});
