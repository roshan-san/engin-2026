import type {
	startupCategory,
	startupCity,
	startupStage,
} from "@convex/schema";
import type { Infer } from "convex/values";

type Stage = Infer<typeof startupStage>;
type Category = Infer<typeof startupCategory>;
type City = Infer<typeof startupCity>;

export const STEPS = ["name", "stage", "kind", "city", "oneLiner"] as const;
export type Step = (typeof STEPS)[number];

export type OnboardingState = {
	readonly step: Step;
	readonly name: string;
	readonly stage: Stage | null;
	readonly category: Category | null;
	readonly city: City | null;
	readonly oneLiner: string;
};

export type OnboardingAction =
	| { type: "type"; field: "name" | "oneLiner"; value: string }
	| { type: "pick"; field: "stage"; value: Stage }
	| { type: "pick"; field: "category"; value: Category }
	| { type: "pick"; field: "city"; value: City }
	| { type: "next" }
	| { type: "back" }
	| { type: "goto"; step: Step };

export const INITIAL_STATE: OnboardingState = {
	step: "name",
	name: "",
	stage: null,
	category: null,
	city: null,
	oneLiner: "",
};

function shift(step: Step, by: 1 | -1): Step {
	const index = STEPS.indexOf(step) + by;
	return STEPS[Math.min(Math.max(index, 0), STEPS.length - 1)] ?? step;
}

/** Whether the current step has what it needs to move on. The one line is optional. */
export function canAdvance(state: OnboardingState): boolean {
	switch (state.step) {
		case "name":
			return state.name.trim() !== "";
		case "stage":
			return state.stage !== null;
		case "kind":
			return state.category !== null;
		case "city":
			return state.city !== null;
		case "oneLiner":
			return true;
	}
}

export function onboardingReducer(
	state: OnboardingState,
	action: OnboardingAction,
): OnboardingState {
	switch (action.type) {
		case "type":
			return { ...state, [action.field]: action.value };
		case "pick":
			return {
				...state,
				[action.field]: action.value,
				step: shift(state.step, 1),
			};
		case "next":
			return canAdvance(state)
				? { ...state, step: shift(state.step, 1) }
				: state;
		case "back":
			return { ...state, step: shift(state.step, -1) };
		case "goto":
			return STEPS.indexOf(action.step) < STEPS.indexOf(state.step)
				? { ...state, step: action.step }
				: state;
	}
}

/** The `startups.create` arguments, or `null` until the name and every chip are set. */
export function toCreateArgs(state: OnboardingState) {
	const name = state.name.trim();
	const { stage, category, city } = state;
	if (!(name && stage && category && city)) return null;

	const oneLiner = state.oneLiner.trim();
	return { name, stage, category, city, ...(oneLiner ? { oneLiner } : {}) };
}
