import { RadioGroup } from "radix-ui";
import { cn } from "~/shared/lib/cn";

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
};

/** A radiogroup of pill buttons. Arrow keys move and pick; Space picks. */
export function ChipPicker<T extends string>({
	label,
	options,
	value,
	onChange,
}: ChipPickerProps<T>) {
	return (
		<RadioGroup.Root
			aria-label={label}
			value={value ?? ""}
			onValueChange={(next) => onChange(next as T)}
			className="flex flex-wrap gap-2"
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
