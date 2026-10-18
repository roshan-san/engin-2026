import { RadioGroup, ToggleGroup } from "radix-ui";
import { cn } from "~/lib/utils";

/** A pill button's look, on or off. */
export function chipClassName(isOn: boolean): string {
	return cn(
		"rounded-full border px-3 py-1.5 text-sm transition-colors focus-ring",
		isOn
			? "border-foreground bg-foreground text-background"
			: "border-input hover:border-foreground/25 hover:bg-accent",
	);
}

type ChipPickerProps<T extends string> = {
	readonly label: string;
	readonly options: readonly { value: T; label: string }[];
	readonly value: T | null;
	readonly onChange: (value: T) => void;
	/** Arrow keys pick as they move. Turn off where picking has a side effect. */
	readonly pickOnArrow?: boolean;
};

/** A radiogroup of pill buttons. Arrow keys move and pick (or only move); Space picks. */
export function ChipPicker<T extends string>({
	label,
	options,
	value,
	onChange,
	pickOnArrow = true,
}: ChipPickerProps<T>) {
	const className = "flex flex-wrap gap-2";

	if (pickOnArrow) {
		return (
			<RadioGroup.Root
				aria-label={label}
				value={value ?? ""}
				onValueChange={(next) => onChange(next as T)}
				className={className}
			>
				{options.map((option) => (
					<RadioGroup.Item
						key={option.value}
						value={option.value}
						className={chipClassName(option.value === value)}
					>
						{option.label}
					</RadioGroup.Item>
				))}
			</RadioGroup.Root>
		);
	}

	return (
		<ToggleGroup.Root
			type="single"
			aria-label={label}
			value={value ?? ""}
			// Clicking the chosen chip again would clear it; keep the pick.
			onValueChange={(next) => next && onChange(next as T)}
			className={className}
		>
			{options.map((option) => (
				<ToggleGroup.Item
					key={option.value}
					value={option.value}
					className={chipClassName(option.value === value)}
				>
					{option.label}
				</ToggleGroup.Item>
			))}
		</ToggleGroup.Root>
	);
}
