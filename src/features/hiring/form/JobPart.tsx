import { ChipPicker } from "~/components/ChipPicker";
import { MODES, PAYS, ROLES } from "../jobChips";
import type { HackathonDraft } from "./draft";
import { Field, Part } from "./FormPart";

export function JobPart({
	job,
	onChange,
}: {
	readonly job: HackathonDraft["job"];
	readonly onChange: (job: HackathonDraft["job"]) => void;
}) {
	return (
		<Part label="The job">
			<Field label="Role">
				<ChipPicker
					label="Role"
					options={ROLES}
					value={job.role}
					onChange={(role) => onChange({ ...job, role })}
				/>
			</Field>
			<Field label="Pay">
				<ChipPicker
					label="Pay"
					options={PAYS}
					value={job.pay}
					onChange={(pay) => onChange({ ...job, pay })}
				/>
			</Field>
			<Field label="Where">
				<ChipPicker
					label="Where"
					options={MODES}
					value={job.mode}
					onChange={(mode) => onChange({ ...job, mode })}
				/>
			</Field>
		</Part>
	);
}
