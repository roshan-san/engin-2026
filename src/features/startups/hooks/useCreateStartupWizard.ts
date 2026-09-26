import { api } from "@convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	STARTUP_CATEGORIES,
	STARTUP_STAGES,
	type StartupCategory,
	type StartupStage,
} from "~/features/startups/constants";
import { createStartupSchema } from "~/features/startups/schemas/startup";
import { toErrorMessage, validate } from "~/lib/validation";

type StepId =
	| "name"
	| "building"
	| "tagline"
	| "category"
	| "stage"
	| "website";

type WizardData = {
	name: string;
	description: string;
	tagline: string;
	category: string;
	stage: string;
	website: string;
};

export const createStartupSteps: Array<{
	id: StepId;
	question: string;
	hint?: string;
	placeholder?: string;
	multiline?: boolean;
	required?: boolean;
	skippable?: boolean;
	kind: "text" | "chips";
	options?: Array<{ value: string; label: string }>;
}> = [
	{
		id: "name",
		question: "What's it called?",
		placeholder: "Acme",
		required: true,
		kind: "text",
	},
	{
		id: "building",
		question: "What are you building?",
		hint: "Plain language. Keep it short.",
		placeholder: "A network where people prove they can work with startups.",
		multiline: true,
		kind: "text",
	},
	{
		id: "tagline",
		question: "One-line pitch?",
		placeholder: "Prove it by shipping",
		skippable: true,
		kind: "text",
	},
	{
		id: "category",
		question: "What category?",
		skippable: true,
		kind: "chips",
		options: [...STARTUP_CATEGORIES],
	},
	{
		id: "stage",
		question: "What stage?",
		skippable: true,
		kind: "chips",
		options: [...STARTUP_STAGES],
	},
	{
		id: "website",
		question: "Got a website?",
		placeholder: "https://",
		skippable: true,
		kind: "text",
	},
];

function stepValue(data: WizardData, id: StepId): string {
	switch (id) {
		case "name":
			return data.name;
		case "building":
			return data.description;
		case "tagline":
			return data.tagline;
		case "category":
			return data.category;
		case "stage":
			return data.stage;
		case "website":
			return data.website;
	}
}

function setStepValue(data: WizardData, id: StepId, value: string): WizardData {
	switch (id) {
		case "name":
			return { ...data, name: value };
		case "building":
			return { ...data, description: value };
		case "tagline":
			return { ...data, tagline: value };
		case "category":
			return { ...data, category: value };
		case "stage":
			return { ...data, stage: value };
		case "website":
			return { ...data, website: value };
	}
}

export function useCreateStartupWizard() {
	const navigate = useNavigate();
	const createStartup = useMutation(api.startups.create);
	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

	const [stepIndex, setStepIndex] = useState(0);
	const [data, setData] = useState<WizardData>({
		name: "",
		description: "",
		tagline: "",
		category: "",
		stage: "",
		website: "",
	});
	const [isPending, setIsPending] = useState(false);

	const step = createStartupSteps[stepIndex];
	const isLast = stepIndex === createStartupSteps.length - 1;
	const value = stepValue(data, step.id);
	const canContinue = !step.required || value.trim().length > 0;

	const goNext = useCallback(() => {
		if (!canContinue || isLast) return;
		setStepIndex((index) => index + 1);
	}, [canContinue, isLast]);

	const goBack = useCallback(() => {
		if (stepIndex === 0) return;
		setStepIndex((index) => index - 1);
	}, [stepIndex]);

	async function create() {
		const result = validate(createStartupSchema, {
			name: data.name,
			description: data.description,
			tagline: data.tagline,
			category: data.category || undefined,
			stage: (data.stage || undefined) as StartupStage | undefined,
			website: data.website,
		});

		if (!result.ok) {
			toast.error(result.message);
			return;
		}

		setIsPending(true);
		try {
			await createStartup({
				name: result.data.name,
				description: result.data.description,
				tagline: result.data.tagline,
				category: result.data.category as StartupCategory | undefined,
				stage: result.data.stage,
				website: result.data.website,
			});
			toast.success("Startup created");
			await navigate({ to: "/app" });
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to create startup"));
		} finally {
			setIsPending(false);
		}
	}

	function continueStep() {
		if (isLast) {
			void create();
		} else {
			goNext();
		}
	}

	function skipStep() {
		setData((previous) => setStepValue(previous, step.id, ""));
		if (isLast) {
			void create();
		} else {
			setStepIndex((index) => index + 1);
		}
	}

	function handleKeyDown(event: React.KeyboardEvent) {
		if (event.key === "Enter" && !step.multiline && canContinue) {
			event.preventDefault();
			continueStep();
		}
	}

	function updateValue(nextValue: string) {
		setData((previous) => setStepValue(previous, step.id, nextValue));
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: refocus when the wizard step changes
	useEffect(() => {
		inputRef.current?.focus();
	}, [stepIndex]);

	return {
		inputRef,
		step,
		stepIndex,
		value,
		canContinue,
		isLast,
		isPending,
		data,
		goBack,
		continueStep,
		skipStep,
		handleKeyDown,
		updateValue,
	};
}
