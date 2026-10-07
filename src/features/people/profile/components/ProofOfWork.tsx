import { Link } from "@tanstack/react-router";

export type ProofOfWorkData = {
	startups: Array<{
		startupId: string;
		name: string;
		slug: string;
		verifiedTasks: number;
		cyclesCompleted: number;
	}>;
	private: {
		startups: number;
		verifiedTasks: number;
		cyclesCompleted: number;
	};
};

type ProofOfWorkProps = {
	readonly proofOfWork: ProofOfWorkData;
};

function workSummary(verifiedTasks: number, cyclesCompleted: number) {
	const tasks = `${verifiedTasks} verified Task${verifiedTasks === 1 ? "" : "s"}`;
	const cycles = `${cyclesCompleted} Cycle${cyclesCompleted === 1 ? "" : "s"} completed`;
	return `${tasks} · ${cycles}`;
}

export function ProofOfWork({ proofOfWork }: ProofOfWorkProps) {
	const hasPrivate = proofOfWork.private.startups > 0;
	if (proofOfWork.startups.length === 0 && !hasPrivate) {
		return null;
	}

	return (
		<section className="space-y-3">
			<div>
				<h2 className="text-lg font-semibold">Proof of Work</h2>
				<p className="text-sm text-muted-foreground">
					Internal work a Founder verified. Shown as evidence; it does not
					change Score.
				</p>
			</div>
			<ul className="space-y-2">
				{proofOfWork.startups.map((startup) => (
					<li key={startup.startupId}>
						<Link
							to="/startup/$slug"
							params={{ slug: startup.slug }}
							className="block rounded-lg border p-4 hover:bg-muted/30"
						>
							<p className="font-medium">{startup.name}</p>
							<p className="text-sm text-muted-foreground">
								{workSummary(startup.verifiedTasks, startup.cyclesCompleted)}
							</p>
						</Link>
					</li>
				))}
				{hasPrivate ? (
					<li className="rounded-lg border p-4">
						<p className="font-medium">
							{proofOfWork.private.startups} private startup
							{proofOfWork.private.startups === 1 ? "" : "s"}
						</p>
						<p className="text-sm text-muted-foreground">
							{workSummary(
								proofOfWork.private.verifiedTasks,
								proofOfWork.private.cyclesCompleted,
							)}
						</p>
					</li>
				) : null}
			</ul>
		</section>
	);
}
