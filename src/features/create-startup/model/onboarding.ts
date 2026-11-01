export const STEPS = ["name", "oneLiner"] as const;
export type Step = (typeof STEPS)[number];

export type OnboardingState = {
	readonly step: Step;
	readonly name: string;
	readonly oneLiner: string;
};

export type OnboardingAction =
	| { type: "type"; field: "name" | "oneLiner"; value: string }
	| { type: "next" }
	| { type: "back" }
	| { type: "goto"; step: Step };

export const INITIAL_STATE: OnboardingState = {
	step: "name",
	name: "",
	oneLiner: "",
};

function shift(step: Step, by: 1 | -1): Step {
	const index = STEPS.indexOf(step) + by;
	return STEPS[Math.min(Math.max(index, 0), STEPS.length - 1)] ?? step;
}

/** Whether the current step has what it needs to move on. The one line is optional. */
export function canAdvance(state: OnboardingState): boolean {
	return state.step === "name" ? state.name.trim() !== "" : true;
}

export function onboardingReducer(
	state: OnboardingState,
	action: OnboardingAction,
): OnboardingState {
	switch (action.type) {
		case "type":
			return { ...state, [action.field]: action.value };
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

/** The `startups.create` arguments, or `null` until the name is set. */
export function toCreateArgs(state: OnboardingState) {
	const name = state.name.trim();
	if (!name) return null;

	const oneLiner = state.oneLiner.trim();
	return { name, ...(oneLiner ? { oneLiner } : {}) };
}
