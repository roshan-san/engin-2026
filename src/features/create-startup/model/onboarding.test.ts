import { describe, expect, it } from "vitest";
import {
	canAdvance,
	type OnboardingState,
	onboardingReducer,
	toCreateArgs,
} from "./onboarding";

const BLANK: OnboardingState = {
	step: "name",
	name: "",
	stage: null,
	category: null,
	city: null,
	oneLiner: "",
};

const FILLED: OnboardingState = {
	step: "oneLiner",
	name: "Acme",
	stage: "building",
	category: "saas",
	city: "pune",
	oneLiner: "",
};

describe("onboarding steps", () => {
	it("a blank name can't advance", () => {
		const typed = onboardingReducer(BLANK, {
			type: "type",
			field: "name",
			value: "   ",
		});

		const next = onboardingReducer(typed, { type: "next" });

		expect(canAdvance(typed)).toBe(false);
		expect(next.step).toBe("name");
	});

	it("a typed name advances to stage", () => {
		const typed = onboardingReducer(BLANK, {
			type: "type",
			field: "name",
			value: "Acme",
		});

		const next = onboardingReducer(typed, { type: "next" });

		expect(next.step).toBe("stage");
	});

	it("picking a stage moves to kind", () => {
		const atStage = { ...BLANK, name: "Acme", step: "stage" } as const;

		const next = onboardingReducer(atStage, {
			type: "pick",
			field: "stage",
			value: "building",
		});

		expect(next.stage).toBe("building");
		expect(next.step).toBe("kind");
	});

	it("next waits for a pick on a chip step", () => {
		const atKind = {
			...BLANK,
			name: "Acme",
			stage: "idea",
			step: "kind",
		} as const;

		const next = onboardingReducer(atKind, { type: "next" });

		expect(next.step).toBe("kind");
	});

	it("back from city returns to kind with choices kept", () => {
		const atCity: OnboardingState = {
			...BLANK,
			name: "Acme",
			stage: "launched",
			category: "ai",
			step: "city",
		};

		const back = onboardingReducer(atCity, { type: "back" });

		expect(back).toEqual({ ...atCity, step: "kind" });
	});

	it("back on the first step stays", () => {
		const back = onboardingReducer(BLANK, { type: "back" });

		expect(back).toEqual(BLANK);
	});

	it("goto returns to an earlier step", () => {
		const atCity: OnboardingState = { ...FILLED, step: "city" };

		const next = onboardingReducer(atCity, { type: "goto", step: "name" });

		expect(next.step).toBe("name");
	});

	it("goto can't skip ahead", () => {
		const atStage: OnboardingState = { ...FILLED, step: "stage" };

		const next = onboardingReducer(atStage, { type: "goto", step: "city" });

		expect(next.step).toBe("stage");
	});

	it("picking the last chip moves to the one line", () => {
		const atCity: OnboardingState = { ...FILLED, city: null, step: "city" };

		const next = onboardingReducer(atCity, {
			type: "pick",
			field: "city",
			value: "mumbai",
		});

		expect(next.step).toBe("oneLiner");
	});
});

describe("onboarding create args", () => {
	it("the one line is optional", () => {
		const args = toCreateArgs({ ...FILLED, oneLiner: "  " });

		expect(args).toEqual({
			name: "Acme",
			stage: "building",
			category: "saas",
			city: "pune",
		});
		expect(args).not.toHaveProperty("oneLiner");
	});

	it("a typed one line is trimmed and sent", () => {
		const args = toCreateArgs({
			...FILLED,
			oneLiner: " Invoices for tailors ",
		});

		expect(args?.oneLiner).toBe("Invoices for tailors");
	});

	it("create args need every chip", () => {
		expect(toCreateArgs({ ...FILLED, stage: null })).toBeNull();
		expect(toCreateArgs({ ...FILLED, category: null })).toBeNull();
		expect(toCreateArgs({ ...FILLED, city: null })).toBeNull();
		expect(toCreateArgs({ ...FILLED, name: " " })).toBeNull();
		expect(toCreateArgs(FILLED)).not.toBeNull();
	});
});
