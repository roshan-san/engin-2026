import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/shared/EmptyState";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { type Verdict, verdictLabel } from "~/features/trialCycles/constants";
import { toErrorMessage } from "~/lib/validation";

type TrialApplicantsProps = {
	readonly applicants: Array<{
		_id: Id<"applications">;
		status: string;
		message?: string | null;
		verdict?: Verdict;
		user: { name: string | null; username: string | null } | null;
	}>;
};

export function TrialApplicants({ applicants }: TrialApplicantsProps) {
	const decide = useMutation(api.applications.decide);
	const [pendingId, setPendingId] = useState<string | null>(null);

	async function setDecision(
		applicationId: Id<"applications">,
		status: "joined" | "rejected",
	) {
		setPendingId(applicationId);
		try {
			await decide({ applicationId, status });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update application"));
		} finally {
			setPendingId(null);
		}
	}

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">Applicants</h2>
			{applicants.length === 0 ? (
				<EmptyState
					title="No applicants yet"
					description="People who apply or join this Trial Cycle will appear here."
				/>
			) : (
				<ul className="space-y-2">
					{applicants.map((applicant) => (
						<li
							key={applicant._id}
							className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
						>
							<div className="min-w-0 flex-1">
								{applicant.user?.username ? (
									<Link
										to="/u/$username"
										params={{ username: applicant.user.username }}
										className="font-medium hover:underline"
									>
										{applicant.user.name ?? applicant.user.username}
									</Link>
								) : (
									<p className="font-medium">
										{applicant.user?.name ?? "Applicant"}
									</p>
								)}
								{applicant.message ? (
									<p className="mt-1 text-sm text-muted-foreground">
										{applicant.message}
									</p>
								) : null}
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary">
									{applicant.verdict
										? verdictLabel(applicant.verdict)
										: applicant.status}
								</Badge>
								{applicant.status === "applied" ? (
									<>
										<Button
											type="button"
											size="sm"
											disabled={pendingId === applicant._id}
											onClick={() => void setDecision(applicant._id, "joined")}
										>
											Accept
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											disabled={pendingId === applicant._id}
											onClick={() =>
												void setDecision(applicant._id, "rejected")
											}
										>
											Reject
										</Button>
									</>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
