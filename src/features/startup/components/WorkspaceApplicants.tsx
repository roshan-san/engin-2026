import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/shared/EmptyState";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { toErrorMessage } from "~/lib/validation";

type WorkspaceApplicantsProps = {
	readonly startupId: Id<"startups">;
};

export function WorkspaceApplicants({ startupId }: WorkspaceApplicantsProps) {
	const applications = useQuery(api.applications.listForStartup, { startupId });
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
			<h2 className="text-lg font-semibold">Applications</h2>
			{applications === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : applications.length === 0 ? (
				<EmptyState
					title="No applications"
					description="When people apply to Trial Cycles, they show up here."
				/>
			) : (
				<ul className="space-y-2">
					{applications.map((application) => (
						<li
							key={application._id}
							className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"
						>
							<div className="min-w-0 flex-1">
								{application.userUsername ? (
									<Link
										to="/u/$username"
										params={{ username: application.userUsername }}
										className="font-medium hover:underline"
									>
										{application.userName}
									</Link>
								) : (
									<p className="font-medium">{application.userName}</p>
								)}
								<p className="text-sm text-muted-foreground">
									{application.trialTitle ?? application.roleTitle ?? "Role"}
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary">{application.status}</Badge>
								{application.status === "applied" ? (
									<>
										<Button
											type="button"
											size="sm"
											disabled={pendingId === application._id}
											onClick={() =>
												void setDecision(application._id, "joined")
											}
										>
											Accept
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											disabled={pendingId === application._id}
											onClick={() =>
												void setDecision(application._id, "rejected")
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
