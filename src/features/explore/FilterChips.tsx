import { chipClassName } from "~/components/ChipPicker";
import { cn } from "~/lib/utils";

type FilterChipsProps<T extends string | number> = {
	readonly label: string;
	readonly options: readonly { readonly value: T; readonly label: string }[];
	readonly value: T | undefined;
	readonly onChange: (next: T | undefined) => void;
};

/** One filter: a muted label, then pill buttons, at most one on. Clicking the chosen one clears it. */
export function FilterChips<T extends string | number>({
	label,
	options,
	value,
	onChange,
}: FilterChipsProps<T>) {
	return (
		<fieldset className="flex min-w-0 shrink-0 items-center gap-2">
			<legend className="sr-only">{label}</legend>
			<span aria-hidden className="text-xs text-muted-foreground">
				{label}
			</span>
			<div className="flex gap-1.5">
				{options.map((option) => {
					const on = option.value === value;
					return (
						<button
							key={option.value}
							type="button"
							aria-pressed={on}
							onClick={() => onChange(on ? undefined : option.value)}
							className={cn(chipClassName(on), "shrink-0 whitespace-nowrap")}
						>
							{option.label}
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}
