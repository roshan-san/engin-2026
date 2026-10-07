import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";

/** `datetime-local` strings in the viewer's local time; deadline "" means none. */
export type HackathonScheduleValue = {
	readonly startsAt: string;
	readonly endsAt: string;
	readonly applicationDeadline: string;
};

type HackathonScheduleFieldsProps = {
	readonly value: HackathonScheduleValue;
	readonly onChange: (value: HackathonScheduleValue) => void;
	readonly disabled?: boolean;
	readonly error?: string;
	/** Keeps input ids unique when the publish dialog opens over the form. */
	readonly idPrefix?: string;
};

/**
 * Start, end and optional application deadline. Controlled and free of
 * Convex calls, so the publish dialog can reuse it to fix passed dates.
 */
export function HackathonScheduleFields({
	value,
	onChange,
	disabled,
	error,
	idPrefix = "hackathon",
}: HackathonScheduleFieldsProps) {
	return (
		<FieldGroup className="gap-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-starts-at`}>Starts</FieldLabel>
					<Input
						id={`${idPrefix}-starts-at`}
						type="datetime-local"
						required
						disabled={disabled}
						value={value.startsAt}
						onChange={(event) =>
							onChange({ ...value, startsAt: event.target.value })
						}
						className="h-11"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-ends-at`}>Ends</FieldLabel>
					<Input
						id={`${idPrefix}-ends-at`}
						type="datetime-local"
						required
						disabled={disabled}
						value={value.endsAt}
						onChange={(event) =>
							onChange({ ...value, endsAt: event.target.value })
						}
						className="h-11"
					/>
				</Field>
			</div>
			<Field>
				<FieldLabel htmlFor={`${idPrefix}-deadline`}>
					Application deadline (optional)
				</FieldLabel>
				<Input
					id={`${idPrefix}-deadline`}
					type="datetime-local"
					disabled={disabled}
					value={value.applicationDeadline}
					onChange={(event) =>
						onChange({ ...value, applicationDeadline: event.target.value })
					}
					className="h-11"
				/>
				<FieldDescription>
					Leave empty to take applications until the start.
				</FieldDescription>
			</Field>
			{error ? <FieldError>{error}</FieldError> : null}
		</FieldGroup>
	);
}
