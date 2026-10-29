import { DEFAULT_PLAN, type PlanKey } from "@convex/shared/plans";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { Button } from "~/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/shared/ui/dialog";
import { Spinner } from "~/shared/ui/spinner";
import { planLines } from "./planLines";
import { useCheckout } from "./useCheckout";

/** The Pro plans, 6 months selected; Continue goes to Dodo checkout and back to `returnPath`. */
export function PlansDialog({
	open,
	onOpenChange,
	returnPath,
	note,
}: {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly returnPath: string;
	/** A line under the title, e.g. "Your draft is saved." */
	readonly note?: string;
}) {
	const { checkout } = useCheckout();
	const [selected, setSelected] = useState<PlanKey>(DEFAULT_PLAN);
	const [isLeaving, setIsLeaving] = useState(false);

	async function proceed() {
		setIsLeaving(true);
		const isLeavingForDodo = await checkout(selected, returnPath);
		// On success the browser is already on its way to Dodo.
		if (!isLeavingForDodo) setIsLeaving(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Pro lets you publish Hackathons</DialogTitle>
					<DialogDescription>
						{note ? `${note} ` : ""}Participants always join free.
					</DialogDescription>
				</DialogHeader>
				<fieldset className="flex flex-col gap-2">
					<legend className="sr-only">Plan</legend>
					{planLines().map((plan) => (
						<label
							key={plan.key}
							className={cn(
								"flex cursor-pointer items-baseline justify-between gap-4 rounded-lg border border-border p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60",
								selected === plan.key && "border-primary bg-accent",
							)}
						>
							<input
								type="radio"
								name="plan"
								value={plan.key}
								checked={selected === plan.key}
								onChange={() => setSelected(plan.key)}
								className="sr-only"
							/>
							<span className="flex flex-col gap-0.5">
								<span className="text-sm font-medium">{plan.name}</span>
								<span className="text-sm text-muted-foreground">
									{plan.hackathons}
								</span>
							</span>
							<span className="shrink-0">
								<span className="text-lg font-semibold tabular-nums">
									{plan.price}
								</span>{" "}
								<span className="text-sm text-muted-foreground">
									{plan.per}
								</span>
							</span>
						</label>
					))}
				</fieldset>
				<DialogFooter>
					<Button onClick={() => void proceed()} disabled={isLeaving}>
						{isLeaving ? <Spinner /> : null}
						Continue to payment
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
