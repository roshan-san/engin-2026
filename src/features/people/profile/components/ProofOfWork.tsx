import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { StartupAvatar } from "~/shell/topbar/StartupAvatar";

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
		<section className="space-y-1">
			<SectionLabel>Proof of Work</SectionLabel>
			<p className="text-sm text-muted-foreground">
				Internal work a Founder verified. Shown as evidence; it does not change
				Score.
			</p>
			<RowList>
				{proofOfWork.startups.map((startup) => (
					<Row
						key={startup.startupId}
						leading={<StartupAvatar name={startup.name} />}
						title={startup.name}
						meta={workSummary(startup.verifiedTasks, startup.cyclesCompleted)}
						to="/startup/$slug"
						params={{ slug: startup.slug }}
					/>
				))}
				{hasPrivate ? (
					<Row
						title={`${proofOfWork.private.startups} private startup${
							proofOfWork.private.startups === 1 ? "" : "s"
						}`}
						meta={workSummary(
							proofOfWork.private.verifiedTasks,
							proofOfWork.private.cyclesCompleted,
						)}
					/>
				) : null}
			</RowList>
		</section>
	);
}
