import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import { BuildFrame } from "~/features/app/layout/BuildFrame";
import { WorkspaceApplicants } from "~/features/startup/components/WorkspaceApplicants";
import { WorkspaceRoles } from "~/features/startup/components/WorkspaceRoles";
import { WorkspaceTrials } from "~/features/startup/components/WorkspaceTrials";

export function TrialsPage() {
	return (
		<BuildFrame>
			<TrialsView />
		</BuildFrame>
	);
}

function TrialsView() {
	const { active } = useWorkspace();
	if (!active) {
		return null;
	}

	const isFounder = active.role === "founder";

	return (
		<div className="space-y-10">
			<p className="max-w-xl text-muted-foreground">
				Post a Role, run a Trial Cycle, judge people on real Pulses, then invite
				them onto the team.
			</p>
			<WorkspaceTrials startupId={active.startup._id} isFounder={isFounder} />
			<WorkspaceRoles startupId={active.startup._id} isFounder={isFounder} />
			{isFounder ? (
				<WorkspaceApplicants startupId={active.startup._id} />
			) : null}
		</div>
	);
}
