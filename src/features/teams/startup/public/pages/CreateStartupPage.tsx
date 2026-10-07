import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FormFooter } from "~/components/shared/FormFooter";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
	createStartupSteps,
	useCreateStartupWizard,
} from "~/features/teams/startup/public/hooks/useCreateStartupWizard";
import { cn } from "~/lib/utils";

/** A short, one-question-at-a-time form that ends in a new Startup. */
export function CreateStartupPage() {
	const {
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
	} = useCreateStartupWizard();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8">
			<div className="flex items-center justify-between gap-4">
				{stepIndex > 0 ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="-ml-2 text-muted-foreground"
						onClick={goBack}
						disabled={isPending}
					>
						<ArrowLeft className="size-4" />
						Back
					</Button>
				) : (
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="-ml-2 text-muted-foreground"
					>
						<Link to="/my-tasks">Cancel</Link>
					</Button>
				)}

				<div className="flex items-center gap-3">
					<div className="flex gap-1.5" aria-hidden>
						{createStartupSteps.map((wizardStep, index) => (
							<span
								key={wizardStep.id}
								className={cn(
									"h-1 w-6 rounded-full",
									index <= stepIndex ? "bg-primary" : "bg-border",
								)}
							/>
						))}
					</div>
					<span className="text-xs tabular-nums text-muted-foreground">
						{stepIndex + 1}/{createStartupSteps.length}
					</span>
				</div>
			</div>

			<PageHeader
				title={step.question}
				meta={step.hint ?? "Create a Startup"}
			/>

			<div>
				{step.kind === "chips" && step.options ? (
					<div className="grid grid-cols-2 gap-2 md:grid-cols-3">
						{step.options.map((option) => (
							<Button
								key={option.value}
								type="button"
								variant={value === option.value ? "default" : "outline"}
								className="h-11 justify-start"
								onClick={() => updateValue(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
				) : step.multiline ? (
					<Textarea
						ref={inputRef as React.RefObject<HTMLTextAreaElement>}
						aria-label={step.question}
						value={value}
						onChange={(event) => updateValue(event.target.value)}
						placeholder={step.placeholder}
						rows={5}
					/>
				) : (
					<Input
						ref={inputRef as React.RefObject<HTMLInputElement>}
						aria-label={step.question}
						type={step.id === "website" ? "url" : "text"}
						value={value}
						onChange={(event) => updateValue(event.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={step.placeholder}
						className="h-11"
					/>
				)}
			</div>

			{isLast && data.name.trim() ? (
				<p className="text-sm text-muted-foreground">
					Launching{" "}
					<span className="font-medium text-foreground">
						{data.name.trim()}
					</span>
				</p>
			) : null}

			<FormFooter>
				{step.skippable ? (
					<Button
						type="button"
						variant="ghost"
						className="h-11 text-muted-foreground"
						disabled={isPending}
						onClick={skipStep}
					>
						Skip
					</Button>
				) : null}
				<Button
					className="h-11 max-md:flex-1"
					disabled={!canContinue || isPending}
					onClick={continueStep}
				>
					{isPending ? "Creating…" : isLast ? "Launch" : "Continue"}
				</Button>
			</FormFooter>
		</div>
	);
}
