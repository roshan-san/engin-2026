import { Link, useNavigate } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { AppPage } from "~/components/AppPage";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { OnboardingStep, STEP_LABELS } from "./OnboardingStep";
import {
	canAdvance,
	INITIAL_STATE,
	onboardingReducer,
	STEPS,
	toCreateArgs,
} from "./onboarding";
import { useCreateStartup } from "./useCreateStartup";

/** Founder onboarding: one question per screen, then the new Startup's Board. */
export function OnboardingFlow() {
	const navigate = useNavigate();
	const createStartup = useCreateStartup();
	const [state, dispatch] = useReducer(onboardingReducer, INITIAL_STATE);
	const [isPending, setIsPending] = useState(false);
	// State lags a render behind, so a fast double Enter would create twice.
	const isSubmittingRef = useRef(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const isLast = state.step === "oneLiner";

	async function submit(withOneLiner: boolean) {
		const args = toCreateArgs(
			withOneLiner ? state : { ...state, oneLiner: "" },
		);
		if (!args || isSubmittingRef.current) return;
		isSubmittingRef.current = true;
		setIsPending(true);
		try {
			const slug = await createStartup(args);
			if (!slug) return;
			await navigate({
				to: "/s/$slug/board",
				params: { slug },
				replace: true,
			});
		} finally {
			// Unmounted once the Board opens; only a failure gets here still on the page.
			isSubmittingRef.current = false;
			if (rootRef.current) setIsPending(false);
		}
	}

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (
				isSubmittingRef.current ||
				event.defaultPrevented ||
				event.isComposing
			) {
				return;
			}
			// Keys aimed at the bar or an open sheet are theirs, not the flow's.
			const target = event.target as Node;
			if (target !== document.body && !rootRef.current?.contains(target)) {
				return;
			}
			if (event.key === "Escape") {
				dispatch({ type: "back" });
			} else if (
				event.key === "Enter" &&
				// A focused button handles Enter as a click.
				!(event.target instanceof HTMLButtonElement) &&
				canAdvance(state)
			) {
				event.preventDefault();
				if (isLast) void submit(true);
				else dispatch({ type: "next" });
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	const current = STEPS.indexOf(state.step);

	return (
		<AppPage
			bar={{
				title: <h1 className="truncate text-sm font-medium">New startup</h1>,
				badge: (
					<span className="text-sm text-muted-foreground">
						Step {current + 1} of {STEPS.length}
					</span>
				),
				actions: (
					<Button asChild variant="ghost" size="icon-sm" aria-label="Leave">
						<Link to="/home">
							<XIcon />
						</Link>
					</Button>
				),
			}}
		>
			<div
				ref={rootRef}
				className="mx-auto flex w-full max-w-xl flex-col gap-8 py-4 md:py-10"
			>
				<nav aria-label="Progress" className="flex items-center gap-1">
					{STEPS.map((step, index) =>
						index < current ? (
							<button
								key={step}
								type="button"
								aria-label={STEP_LABELS[step]}
								disabled={isPending}
								onClick={() => dispatch({ type: "goto", step })}
								className="group rounded-full p-1.5 focus-ring focus-visible:outline-hidden"
							>
								<span className="block size-2 rounded-full bg-foreground/50 transition-colors group-hover:bg-foreground" />
							</button>
						) : (
							<span
								key={step}
								role="img"
								aria-label={STEP_LABELS[step]}
								aria-current={index === current ? "step" : undefined}
								className="p-1.5"
							>
								<span
									className={cn(
										"block size-2 rounded-full",
										index === current ? "bg-foreground" : "bg-border",
									)}
								/>
							</span>
						),
					)}
				</nav>
				<OnboardingStep key={state.step} state={state} dispatch={dispatch} />
				{isLast ? (
					<div className="flex items-center gap-2">
						<Button disabled={isPending} onClick={() => void submit(true)}>
							Create startup
						</Button>
						<Button
							variant="ghost"
							disabled={isPending}
							onClick={() => void submit(false)}
						>
							Skip
						</Button>
					</div>
				) : null}
			</div>
		</AppPage>
	);
}
