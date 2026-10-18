import { TEXT } from "@convex/shared/limits";
import { CharCount } from "~/components/CharCount";
import { ChipPicker } from "~/components/ChipPicker";
import { Input } from "~/components/ui/input";
import { type HackathonDraft, PARTICIPANTS_GET } from "./draft";
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
			label="What Participants get"
			note="Even ₹1,000 brings better Participants."
		>
			<ChipPicker
				label="What Participants get"
				options={PARTICIPANTS_GET_CHIPS}
				value={value.choice}
				onChange={(choice) => onChange({ ...value, choice })}
			/>
			{value.choice === "Custom" ? (
				<div className="flex flex-col gap-1.5">
					<Input
						aria-label="What Participants get"
						placeholder="One line"
						value={value.custom}
						maxLength={TEXT.participantsGet}
						onChange={(e) =>
							onChange({
								...value,
								custom: e.target.value,
							})
						}
					/>
					<CharCount value={value.custom} max={TEXT.participantsGet} />
				</div>
			) : null}
		</Part>
	);
}
