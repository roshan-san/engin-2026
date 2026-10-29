import { STARTUP_TEXT } from "@convex/startups/rules";
import { type ReactNode, useEffect, useRef } from "react";
import { CITIES, KINDS, STAGES } from "~/entities/startup";
import { ChipPicker } from "~/shared/ui/ChipPicker";
import { Input } from "~/shared/ui/input";
import { MentorNote } from "~/shared/ui/MentorNote";
import type {
	OnboardingAction,
	OnboardingState,
	Step,
} from "../model/onboarding";

export const STEP_LABELS: Record<Step, string> = {
	name: "Name",
	stage: "Stage",
	kind: "Kind",
	city: "City",
	oneLiner: "One line",
};

const QUESTIONS: Record<Step, string> = {
	name: "Name your startup.",
	stage: "Pick your stage.",
	kind: "What kind of startup is it?",
	city: "Pick your city.",
	oneLiner: "Describe it in one line.",
};

/** One question, with the control that answers it. */
export function OnboardingStep({
	state,
	dispatch,
}: {
	readonly state: OnboardingState;
	readonly dispatch: (action: OnboardingAction) => void;
}) {
	return (
		<section
			aria-labelledby="onboarding-question"
			className="flex flex-col gap-5"
		>
			<h2 id="onboarding-question" className="text-2xl font-semibold">
				{QUESTIONS[state.step]}
			</h2>
			{renderControl(state, dispatch)}
		</section>
	);
}

function renderControl(
	state: OnboardingState,
	dispatch: (action: OnboardingAction) => void,
): ReactNode {
	switch (state.step) {
		case "name":
			return (
				<TextStep
					label="Startup name"
					value={state.name}
					maxLength={STARTUP_TEXT.name}
					onChange={(value) => dispatch({ type: "type", field: "name", value })}
				/>
			);
		case "stage":
			return (
				<>
					<ChipPicker
						pickOnArrow={false}
						label="Stage"
						options={STAGES}
						value={state.stage}
						onChange={(value) =>
							dispatch({ type: "pick", field: "stage", value })
						}
					/>
					<MentorNote>Be honest. It sets your baseline.</MentorNote>
				</>
			);
		case "kind":
			return (
				<ChipPicker
					pickOnArrow={false}
					label="Kind"
					options={KINDS}
					value={state.category}
					onChange={(value) =>
						dispatch({ type: "pick", field: "category", value })
					}
				/>
			);
		case "city":
			return (
				<ChipPicker
					pickOnArrow={false}
					label="City"
					options={CITIES}
					value={state.city}
					onChange={(value) => dispatch({ type: "pick", field: "city", value })}
				/>
			);
		case "oneLiner":
			return (
				<>
					<TextStep
						label="One line"
						value={state.oneLiner}
						maxLength={STARTUP_TEXT.oneLiner}
						onChange={(value) =>
							dispatch({ type: "type", field: "oneLiner", value })
						}
					/>
					<MentorNote>Who it's for. What changes for them.</MentorNote>
				</>
			);
	}
}

function TextStep({
	label,
	value,
	maxLength,
	onChange,
}: {
	readonly label: string;
	readonly value: string;
	readonly maxLength: number;
	readonly onChange: (value: string) => void;
}) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => ref.current?.focus(), []);

	return (
		<Input
			ref={ref}
			aria-label={label}
			value={value}
			maxLength={maxLength}
			autoComplete="off"
			className="h-11 text-base"
			onChange={(event) => onChange(event.target.value)}
		/>
	);
}
