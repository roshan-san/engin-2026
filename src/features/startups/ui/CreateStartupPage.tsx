import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	createStartupSteps,
	useCreateStartupWizard,
} from "~/features/startups/hooks/useCreateStartupWizard";
import { cn } from "~/lib/utils";

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
		<div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-2 py-6 sm:py-10">
			<div className="mb-10 flex items-center justify-between gap-4">
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
						<Link to="/app">Cancel</Link>
					</Button>
				)}

				<div className="flex gap-1.5" aria-hidden>
					{createStartupSteps.map((wizardStep, index) => (
						<span
							key={wizardStep.id}
							className={cn(
								"h-1 w-6 rounded-full",
								index <= stepIndex ? "bg-primary" : "bg-muted",
							)}
						/>
					))}
				</div>

				<span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
					{stepIndex + 1}/{createStartupSteps.length}
				</span>
			</div>

			<div className="flex flex-1 flex-col justify-center pb-16">
				<h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
					{step.question}
				</h1>
				{step.hint ? (
					<p className="mt-3 text-base text-muted-foreground sm:text-lg">
						{step.hint}
					</p>
				) : null}

				<div className="mt-10 sm:mt-12">
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
						<textarea
							ref={inputRef as React.RefObject<HTMLTextAreaElement>}
							value={value}
							onChange={(event) => updateValue(event.target.value)}
							placeholder={step.placeholder}
							rows={4}
							className="w-full resize-none border-0 border-b border-border bg-transparent pb-3 text-xl font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none sm:text-2xl"
						/>
					) : (
						<input
							ref={inputRef as React.RefObject<HTMLInputElement>}
							type={step.id === "website" ? "url" : "text"}
							value={value}
							onChange={(event) => updateValue(event.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={step.placeholder}
							className="w-full border-0 border-b border-border bg-transparent pb-3 text-xl font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none sm:text-2xl"
						/>
					)}
				</div>

				<div className="mt-12 flex flex-wrap items-center gap-3">
					<Button
						size="lg"
						className="rounded-full px-8"
						disabled={!canContinue || isPending}
						onClick={continueStep}
					>
						{isPending ? "Creating…" : isLast ? "Launch" : "Continue"}
					</Button>
					{step.skippable ? (
						<Button
							type="button"
							variant="ghost"
							size="lg"
							className="text-muted-foreground"
							disabled={isPending}
							onClick={skipStep}
						>
							Skip
						</Button>
					) : null}
				</div>

				{isLast && data.name.trim() ? (
					<p className="mt-8 text-sm text-muted-foreground">
						Launching{" "}
						<span className="font-medium text-foreground">
							{data.name.trim()}
						</span>
					</p>
				) : null}
			</div>
		</div>
	);
}
