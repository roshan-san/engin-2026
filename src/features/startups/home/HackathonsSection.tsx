import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { roleLabel } from "~/features/hiring/jobChips";
import { myHackathonStatus } from "./hackathonStatus";
import { useMyApplications } from "./hooks/useMyApplications";

/** Your Hackathons. A stopgap until the place switcher's Applied group (phase 5). */
export function HackathonsSection() {
	const applications = useMyApplications();
	if (!applications || applications.length === 0) return null;

	return (
		<section className="flex flex-col gap-1">
			<SectionLabel>Hackathons</SectionLabel>
			<RowList>
				{applications.map((application) => {
					const { label, to } = myHackathonStatus(application);
					return (
						<Row
							key={application.applicationId}
							title={`${roleLabel(application.job.role)} at ${application.startupName}`}
							trailing={label}
							to={to}
							params={{ id: application.hackathonId }}
						/>
					);
				})}
			</RowList>
		</section>
	);
}
