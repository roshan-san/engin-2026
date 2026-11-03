import { HACKATHON_TEXT } from "@convex/hackathons/rules";
import { DISCIPLINES } from "~/shared/config/disciplines";
import { MODES, PAYS } from "~/shared/config/jobs";
import { ChipPicker } from "~/shared/ui/ChipPicker";
import { Input } from "~/shared/ui/input";
import type { HackathonDraft } from "../model/draft";
import { Field, Part } from "./FormPart";

/** The job: its title, then discipline, pay and where as chips. */
export function JobPart({
	job,
	onChange,
}: {
	readonly job: HackathonDraft["job"];
	readonly onChange: (job: HackathonDraft["job"]) => void;
}) {
	return (
		<Part label="The job">
			<Field label="Title">
				<Input
					aria-label="Title"
					placeholder="Growth lead"
					maxLength={HACKATHON_TEXT.title}
					value={job.title}
					onChange={(event) => onChange({ ...job, title: event.target.value })}
				/>
			</Field>
			<Field label="Discipline">
				<ChipPicker
					label="Discipline"
					options={DISCIPLINES}
					value={job.discipline}
					onChange={(discipline) => onChange({ ...job, discipline })}
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
