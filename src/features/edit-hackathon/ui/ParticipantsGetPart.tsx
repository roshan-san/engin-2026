import { HACKATHON_TEXT } from "@convex/hackathons/rules";
import { CharCount } from "~/shared/ui/CharCount";
import { ChipPicker } from "~/shared/ui/ChipPicker";
import { Input } from "~/shared/ui/input";
import { type HackathonDraft, PARTICIPANTS_GET } from "../model/draft";
import { Part } from "./FormPart";

const PARTICIPANTS_GET_CHIPS = [...PARTICIPANTS_GET, "Custom"].map((value) => ({
	value,
	label: value,
}));

/** What Participants get: a preset, or a custom line. */
export function ParticipantsGetPart({
	value,
	onChange,
}: {
	readonly value: HackathonDraft["participantsGet"];
	readonly onChange: (value: HackathonDraft["participantsGet"]) => void;
}) {
	return (
		<Part
			label="What Builders get"
			note={
				value.choice === "Nothing"
					? "With nothing on offer, expect fewer and less experienced Builders."
					: "Even ₹1,000 brings better Builders."
			}
		>
			<ChipPicker
				label="What Builders get"
				options={PARTICIPANTS_GET_CHIPS}
				value={value.choice}
				onChange={(choice) => onChange({ ...value, choice })}
			/>
			{value.choice === "Custom" ? (
				<div className="flex flex-col gap-1.5">
					<Input
						aria-label="What Builders get"
						placeholder="One line"
						value={value.custom}
						maxLength={HACKATHON_TEXT.participantsGet}
						onChange={(e) =>
							onChange({
								...value,
								custom: e.target.value,
							})
						}
					/>
					<CharCount
						value={value.custom}
						max={HACKATHON_TEXT.participantsGet}
					/>
				</div>
			) : null}
		</Part>
	);
}
