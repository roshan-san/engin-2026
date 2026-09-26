import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import { PulseBoard } from "~/features/pulses/components/PulseBoard";
import { WorkspaceApplicants } from "~/features/startup/components/WorkspaceApplicants";
import { WorkspaceCycles } from "~/features/startup/components/WorkspaceCycles";
import { WorkspaceOffers } from "~/features/startup/components/WorkspaceOffers";
import { WorkspaceRoles } from "~/features/startup/components/WorkspaceRoles";
import { WorkspaceTrials } from "~/features/startup/components/WorkspaceTrials";
import { categoryLabel, stageLabel } from "~/features/startups/constants";

export function StartupPage() {
	const { active: startup, isLoading } = useWorkspace();

	if (isLoading) {
		return <PageLoading />;
	}

	if (!startup) {
		return (
			<div className="w-full py-10">
				<h1 className="text-2xl font-bold">Workspace</h1>
				<p className="mt-2 text-muted-foreground">
					Create a startup to open its workspace.
				</p>
				<Button asChild className="mt-6">
					<Link to="/app/startups/new">Create startup</Link>
				</Button>
			</div>
		);
	}

	const doc = startup.startup;
	const isFounder = startup.role === "founder";

	return (
		<div className="w-full space-y-10 py-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<h1 className="text-2xl font-bold">{doc.name}</h1>
					<p className="mt-1 text-muted-foreground">
						{doc.tagline ?? "Startup workspace"} · {startup.role}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{[categoryLabel(doc.category), stageLabel(doc.stage)]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild>
						<Link to="/startup/$slug" params={{ slug: doc.slug }}>
							Public page
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/app/team">Team</Link>
					</Button>
				</div>
			</div>

			<PulseBoard startupId={doc._id} canCreate />
			<WorkspaceCycles startupId={doc._id} isFounder={isFounder} />
			<WorkspaceRoles startupId={doc._id} isFounder={isFounder} />
			<WorkspaceTrials startupId={doc._id} isFounder={isFounder} />
			{isFounder ? <WorkspaceApplicants startupId={doc._id} /> : null}
			{isFounder ? <WorkspaceOffers startupId={doc._id} /> : null}
		</div>
	);
}
