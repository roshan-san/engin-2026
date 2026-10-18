import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { PAYMENT_ISSUE } from "./draftPublish";
import { PlansDialog } from "./PlansDialog";
import { planSummary } from "./planLines";
import { usePaymentIssue } from "./usePaymentIssue";
import { usePlan } from "./usePlan";
import { usePortal } from "./usePortal";

/** Your plan in Settings: what's left and Manage billing, or the plans when you have none. */
export function PlanSection() {
	const plan = usePlan();
	const hasPaymentIssue = usePaymentIssue();
	const { pathname } = useLocation();
	const { openPortal, isOpening } = usePortal();
	const [isPlansOpen, setPlansOpen] = useState(false);

	if (plan === undefined || hasPaymentIssue === undefined) {
		return null;
	}

	return (
		<section className="flex flex-col gap-2 px-4">
			<h3 className="text-sm font-medium">Plan</h3>
			{plan || hasPaymentIssue ? (
				<>
					<p className="text-sm text-muted-foreground">
						{plan ? planSummary(plan) : PAYMENT_ISSUE}
					</p>
					<Button
						variant="outline"
						size="sm"
						className="self-start"
						disabled={isOpening}
						onClick={() => void openPortal()}
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
