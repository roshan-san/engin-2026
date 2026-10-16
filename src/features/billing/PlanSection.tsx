import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { PlansDialog } from "./PlansDialog";
import { planSummary } from "./planLines";
import { usePlan } from "./usePlan";
import { usePortal } from "./usePortal";

/** Your plan in Settings: what's left and Manage billing, or the plans when you have none. */
export function PlanSection() {
	const plan = usePlan();
	const { pathname } = useLocation();
	const { openPortal } = usePortal();
	const [isPlansOpen, setPlansOpen] = useState(false);
	const [isOpening, setIsOpening] = useState(false);

	if (plan === undefined) {
		return null;
	}

	async function manage() {
		setIsOpening(true);
		const isLeavingForDodo = await openPortal();
		if (!isLeavingForDodo) setIsOpening(false);
	}

	return (
		<section className="flex flex-col gap-2 px-4">
			<h3 className="text-sm font-medium">Plan</h3>
			{plan ? (
				<>
					<p className="text-sm text-muted-foreground">{planSummary(plan)}</p>
					<Button
						variant="outline"
						size="sm"
						className="self-start"
						disabled={isOpening}
						onClick={() => void manage()}
					>
						{isOpening ? <Spinner /> : null}
						Manage billing
					</Button>
				</>
			) : (
				<>
					<p className="text-sm text-muted-foreground">
						Free. Pro lets you publish Hackathons.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="self-start"
						onClick={() => setPlansOpen(true)}
					>
						See plans
					</Button>
					<PlansDialog
						open={isPlansOpen}
						onOpenChange={setPlansOpen}
						returnPath={pathname}
					/>
				</>
			)}
		</section>
	);
}
