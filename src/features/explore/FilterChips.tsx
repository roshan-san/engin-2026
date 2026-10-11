import { cn } from "~/lib/utils";

type FilterChipsProps<T extends string | number> = {
	readonly label: string;
	readonly options: readonly { readonly value: T; readonly label: string }[];
	readonly value: T | undefined;
	readonly onChange: (next: T | undefined) => void;
};

/** One filter: pill buttons, at most one on. Clicking the chosen one clears it. */
export function FilterChips<T extends string | number>({
	label,
	options,
	value,
	onChange,
}: FilterChipsProps<T>) {
	return (
		<fieldset className="min-w-0">
			<legend className="mb-2 text-xs font-semibold text-muted-foreground max-md:sr-only">
				{label}
			</legend>
			<div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
				{options.map((option) => {
					const on = option.value === value;
					return (
						<button
							key={option.value}
							type="button"
							aria-pressed={on}
							onClick={() => onChange(on ? undefined : option.value)}
							className={cn(
								"shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-hidden",
								on
									? "border-foreground bg-foreground text-background"
									: "border-input hover:border-foreground/25 hover:bg-accent",
							)}
						>
							{option.label}
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}
